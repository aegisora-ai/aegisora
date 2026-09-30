const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");
const { schnorr } = require("@noble/curves/secp256k1.js");

const testPath = process.argv[2];
const fixtureDirectory = process.argv[3];

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function sha256Prefixed(value) {
  return "sha256:" + sha256(value);
}

function canonicalJson(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }

  const keys = Object.keys(value).sort();

  return "{" +
    keys.map((key) => {
      return JSON.stringify(key) + ":" + canonicalJson(value[key]);
    }).join(",") +
    "}";
}

function eventId(pubkey, createdAt, kind, tags, content) {
  return sha256(
    JSON.stringify([
      0,
      pubkey,
      createdAt,
      kind,
      tags,
      content
    ])
  );
}

function skipQuoted(source, index, quote) {
  let i = index + 1;

  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }

    if (source[i] === quote) {
      return i + 1;
    }

    i++;
  }

  return source.length;
}

function skipLineComment(source, index) {
  const next = source.indexOf("\n", index + 2);

  if (next === -1) {
    return source.length;
  }

  return next + 1;
}

function skipBlockComment(source, index) {
  const next = source.indexOf("*/", index + 2);

  if (next === -1) {
    return source.length;
  }

  return next + 2;
}

function findMatchingParen(source, openIndex) {
  let depth = 0;
  let i = openIndex;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "'" || ch === '"') {
      i = skipQuoted(source, i, ch);
      continue;
    }

    if (ch === "`") {
      i = skipQuoted(source, i, "`");
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      i = skipLineComment(source, i);
      continue;
    }

    if (ch === "/" && source[i + 1] === "*") {
      i = skipBlockComment(source, i);
      continue;
    }

    if (ch === "(") {
      depth++;
    }

    if (ch === ")") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }

    i++;
  }

  return -1;
}

function splitTopLevelArguments(source) {
  const pieces = [];
  let start = 0;

  let paren = 0;
  let brace = 0;
  let bracket = 0;

  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "'" || ch === '"') {
      i = skipQuoted(source, i, ch);
      continue;
    }

    if (ch === "`") {
      i = skipQuoted(source, i, "`");
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      i = skipLineComment(source, i);
      continue;
    }

    if (ch === "/" && source[i + 1] === "*") {
      i = skipBlockComment(source, i);
      continue;
    }

    if (ch === "(") paren++;
    if (ch === ")") paren--;

    if (ch === "{") brace++;
    if (ch === "}") brace--;

    if (ch === "[") bracket++;
    if (ch === "]") bracket--;

    if (
      ch === "," &&
      paren === 0 &&
      brace === 0 &&
      bracket === 0
    ) {
      pieces.push(
        source.slice(start, i).trim()
      );

      start = i + 1;
    }

    i++;
  }

  pieces.push(
    source.slice(start).trim()
  );

  return pieces;
}

function findVerifyCalls(source) {
  const calls = [];

  let searchFrom = 0;

  while (true) {
    const index = source.indexOf(
      "verifyExecutionBinding",
      searchFrom
    );

    if (index === -1) {
      break;
    }

    let open = index + "verifyExecutionBinding".length;

    while (
      open < source.length &&
      /\s/.test(source[open])
    ) {
      open++;
    }

    if (source[open] !== "(") {
      searchFrom = index + 1;
      continue;
    }

    const close = findMatchingParen(
      source,
      open
    );

    if (close === -1) {
      break;
    }

    const inside = source.slice(
      open + 1,
      close
    );

    const args = splitTopLevelArguments(
      inside
    );

    if (args.length >= 2) {
      calls.push({
        first: args[0],
        second: args[1],
        index
      });
    }

    searchFrom = close + 1;
  }

  return calls;
}

function normalizeTsExpression(expression) {
  let value = expression.trim();

  value = value.replace(
    /\s+as\s+(?:const|[A-Za-z_$][A-Za-z0-9_$<>\[\]| ]*)\s*$/g,
    ""
  );

  value = value.replace(
    /\s+as\s+const\s*$/g,
    ""
  );

  return value.trim();
}

function findVariableInitializer(source, variableName) {
  const token =
    "\\b(?:const|let|var)\\s+" +
    variableName +
    "\\s*=\\s*";

  const pattern = new RegExp(
    token
  );

  const match = pattern.exec(source);

  if (!match) {
    return undefined;
  }

  let index =
    match.index + match[0].length;

  while (
    index < source.length &&
    /\s/.test(source[index])
  ) {
    index++;
  }

  if (
    source[index] === "{" ||
    source[index] === "[" ||
    source[index] === "("
  ) {
    const closeMap = {
      "{": "}",
      "[": "]",
      "(": ")"
    };

    const closeIndex = findBalanced(
      source,
      index,
      source[index],
      closeMap[source[index]]
    );

    if (closeIndex === -1) {
      return undefined;
    }

    return source.slice(
      index,
      closeIndex + 1
    );
  }

  let end = index;

  while (
    end < source.length &&
    source[end] !== ";" &&
    source[end] !== "\n"
  ) {
    end++;
  }

  return source.slice(
    index,
    end
  ).trim();
}

function findBalanced(
  source,
  openIndex,
  openChar,
  closeChar
) {
  let depth = 0;
  let i = openIndex;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "'" || ch === '"') {
      i = skipQuoted(source, i, ch);
      continue;
    }

    if (ch === "`") {
      i = skipQuoted(source, i, "`");
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      i = skipLineComment(source, i);
      continue;
    }

    if (ch === "/" && source[i + 1] === "*") {
      i = skipBlockComment(source, i);
      continue;
    }

    if (ch === openChar) {
      depth++;
    }

    if (ch === closeChar) {
      depth--;

      if (depth === 0) {
        return i;
      }
    }

    i++;
  }

  return -1;
}

function evaluateExpression(
  source,
  expression,
  seen = new Set()
) {
  let value = normalizeTsExpression(
    expression
  );

  if (
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
  ) {
    if (seen.has(value)) {
      throw new Error(
        "Circular variable reference: " +
        value
      );
    }

    const initializer =
      findVariableInitializer(
        source,
        value
      );

    if (!initializer) {
      throw new Error(
        "Variable initializer not found: " +
        value
      );
    }

    const next = new Set(seen);
    next.add(value);

    return evaluateExpression(
      source,
      initializer,
      next
    );
  }

  let script = value;

  script = script.replace(
    /\s+as\s+const\b/g,
    ""
  );

  return vm.runInNewContext(
    "(" + script + ")",
    Object.create(null),
    {
      timeout: 1000
    }
  );
}

function normalizeContext(value, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      label +
      " is not an object execution context."
    );
  }

  if (typeof value.agentId !== "string") {
    throw new Error(
      label +
      " has no valid agentId."
    );
  }

  if (typeof value.tool !== "string") {
    throw new Error(
      label +
      " has no valid tool."
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      value,
      "args"
    )
  ) {
    throw new Error(
      label +
      " has no args field."
    );
  }

  return {
    agentId: value.agentId,
    tool: value.tool,
    args: value.args
  };
}

function privateKey(label) {
  return Uint8Array.from(
    crypto
      .createHash("sha256")
      .update(
        "aegisora-3.0-13-" + label,
        "utf8"
      )
      .digest()
  );
}

function makeFixture(label, context) {
  const toolHash =
    sha256Prefixed(context.tool);

  const argsHash =
    sha256Prefixed(
      canonicalJson(context.args)
    );

  const preimage = {
    action_binding_agent_id:
      context.agentId,

    action_binding_args_hash:
      argsHash,

    action_binding_tool_hash:
      toolHash
  };

  const preimageFields = [
    "action_binding_agent_id",
    "action_binding_args_hash",
    "action_binding_tool_hash"
  ];

  const decisionRef =
    sha256Prefixed(
      canonicalJson(preimage)
    );

  const createdAt =
    label === "A"
      ? 1760000101
      : 1760000102;

  const kind = 1;
  const tags = [];

  const key = privateKey(label);

  const pubkey =
    Buffer.from(
      schnorr.getPublicKey(key)
    ).toString("hex");

  const contentObject = {
    protocol:
      "aegisora.external-decision.v1",

    decision: "ALLOW",

    decision_ref:
      decisionRef,

    decision_ref_preimage_fields:
      preimageFields,

    action_binding_tool_hash:
      toolHash,

    action_binding_args_hash:
      argsHash,

    action_binding_agent_id:
      context.agentId,

    tool:
      context.tool,

    action:
      "tool.execute",

    fixture:
      label
  };

  const content =
    JSON.stringify(contentObject);

  const id =
    eventId(
      pubkey,
      createdAt,
      kind,
      tags,
      content
    );

  const sig =
    Buffer.from(
      schnorr.sign(id, key)
    ).toString("hex");

  return {
    event: {
      id,
      pubkey,
      created_at: createdAt,
      kind,
      tags,
      content,
      sig
    },

    decision_ref:
      decisionRef,

    action_binding_tool_hash:
      toolHash,

    action_binding_args_hash:
      argsHash,

    action_binding_agent_id:
      context.agentId
  };
}

if (!testPath || !fixtureDirectory) {
  console.log(
    "GENERATION_STATUS=INVALID_ARGUMENTS"
  );

  process.exitCode = 2;
} else {
  try {
    const source =
      fs.readFileSync(
        testPath,
        "utf8"
      );

    const calls =
      findVerifyCalls(source);

    console.log(
      "VERIFY_CALL_COUNT=" +
      calls.length
    );

    calls.forEach(
      (call, index) => {
        console.log(
          "CALL_" +
          (index + 1) +
          "_FIRST=" +
          call.first
        );

        console.log(
          "CALL_" +
          (index + 1) +
          "_SECOND=" +
          call.second
        );
      }
    );

    const callA =
      calls.find(
        (call) =>
          call.first === "bindingA"
      );

    const callB =
      calls.find(
        (call) =>
          call.first === "bindingB"
      );

    console.log(
      "CALL_A_FOUND=" +
      Boolean(callA)
    );

    console.log(
      "CALL_B_FOUND=" +
      Boolean(callB)
    );

    if (!callA || !callB) {
      throw new Error(
        "bindingA/bindingB calls were not found. The console output above contains every verifyExecutionBinding call discovered."
      );
    }

    const rawA =
      evaluateExpression(
        source,
        callA.second
      );

    const rawB =
      evaluateExpression(
        source,
        callB.second
      );

    const contextA =
      normalizeContext(
        rawA,
        "Fixture A"
      );

    const contextB =
      normalizeContext(
        rawB,
        "Fixture B"
      );

    console.log(
      "CONTEXT_A=" +
      JSON.stringify(contextA)
    );

    console.log(
      "CONTEXT_B=" +
      JSON.stringify(contextB)
    );

    fs.mkdirSync(
      fixtureDirectory,
      {
        recursive: true
      }
    );

    const fixtureA =
      makeFixture(
        "A",
        contextA
      );

    const fixtureB =
      makeFixture(
        "B",
        contextB
      );

    const fixtureAPath =
      path.join(
        fixtureDirectory,
        "3.0-13-fixture-a.json"
      );

    const fixtureBPath =
      path.join(
        fixtureDirectory,
        "3.0-13-fixture-b.json"
      );

    fs.writeFileSync(
      fixtureAPath,
      JSON.stringify(
        fixtureA,
        null,
        2
      ) + "\n",
      "utf8"
    );

    fs.writeFileSync(
      fixtureBPath,
      JSON.stringify(
        fixtureB,
        null,
        2
      ) + "\n",
      "utf8"
    );

    console.log(
      "GENERATION_STATUS=SUCCESS"
    );

    console.log(
      "FIXTURE_A=" +
      fixtureAPath
    );

    console.log(
      "FIXTURE_B=" +
      fixtureBPath
    );
  } catch (error) {
    console.log(
      "GENERATION_STATUS=FAILED"
    );

    console.log(
      "GENERATION_ERROR=" +
      (
        error &&
        error.stack
          ? error.stack
          : String(error)
      )
    );

    process.exitCode = 1;
  }
}
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { schnorr } = require("@noble/curves/secp256k1.js");

const fixtureDirectory = process.argv[2];

function sha256Hex(value) {
  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function sha256Prefixed(value) {
  return "sha256:" + sha256Hex(value);
}

function canonicalJson(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" +
      value.map(canonicalJson).join(",") +
      "]";
  }

  const keys = Object.keys(value).sort();

  return "{" +
    keys.map(function (key) {
      return JSON.stringify(key) +
        ":" +
        canonicalJson(value[key]);
    }).join(",") +
    "}";
}

function eventId(
  pubkey,
  createdAt,
  kind,
  tags,
  content
) {
  return sha256Hex(
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

function makePrivateKey(label) {
  return Uint8Array.from(
    crypto
      .createHash("sha256")
      .update(
        "aegisora-3.0-13-static-" + label,
        "utf8"
      )
      .digest()
  );
}

function makeFixture(
  label,
  agentId,
  tool,
  args,
  createdAt
) {
  const toolHash =
    sha256Prefixed(tool);

  const argsHash =
    sha256Prefixed(
      canonicalJson(args)
    );

  const preimage = {
    action_binding_agent_id:
      agentId,

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

  const key =
    makePrivateKey(label);

  const pubkey =
    Buffer.from(
      schnorr.getPublicKey(key)
    ).toString("hex");

  const tags = [];
  const kind = 1;

  const contentObject = {
    protocol:
      "aegisora.external-decision.v1",

    decision:
      "ALLOW",

    decision_ref:
      decisionRef,

    decision_ref_preimage_fields:
      preimageFields,

    action_binding_tool_hash:
      toolHash,

    action_binding_args_hash:
      argsHash,

    action_binding_agent_id:
      agentId,

    tool:
      tool,

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
      schnorr.sign(Uint8Array.from(Buffer.from(id, "hex")), key)
    ).toString("hex");

  return {
    event: {
      id: id,
      pubkey: pubkey,
      created_at: createdAt,
      kind: kind,
      tags: tags,
      content: content,
      sig: sig
    },

    decision_ref:
      decisionRef,

    action_binding_tool_hash:
      toolHash,

    action_binding_args_hash:
      argsHash,

    action_binding_agent_id:
      agentId
  };
}

if (!fixtureDirectory) {
  console.log(
    "STATUS=INVALID_ARGUMENTS"
  );
  process.exitCode = 2;
} else {
  try {
    fs.mkdirSync(
      fixtureDirectory,
      {
        recursive: true
      }
    );

    const fixtureA =
      makeFixture(
        "A",
        "agent-fixture-A",
        "fixture.tool.read",
        {
          path: "fixture-a.txt",
          mode: "read"
        },
        1760000101
      );

    const fixtureB =
      makeFixture(
        "B",
        "agent-fixture-B",
        "fixture.tool.write",
        {
          path: "fixture-b.txt",
          mode: "write"
        },
        1760000102
      );

    const fileA =
      path.join(
        fixtureDirectory,
        "3.0-13-fixture-a.json"
      );

    const fileB =
      path.join(
        fixtureDirectory,
        "3.0-13-fixture-b.json"
      );

    fs.writeFileSync(
      fileA,
      JSON.stringify(
        fixtureA,
        null,
        2
      ) + "\n",
      "utf8"
    );

    fs.writeFileSync(
      fileB,
      JSON.stringify(
        fixtureB,
        null,
        2
      ) + "\n",
      "utf8"
    );

    console.log(
      "FIXTURE_A=" + fileA
    );

    console.log(
      "FIXTURE_B=" + fileB
    );

    console.log(
      "GENERATION_STATUS=SUCCESS"
    );
  } catch (error) {
    console.log(
      "GENERATION_STATUS=FAILED"
    );

    console.log(
      String(
        error &&
        error.stack
          ? error.stack
          : error
      )
    );

    process.exitCode = 1;
  }
}
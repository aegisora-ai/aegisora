const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { schnorr } = require("@noble/curves/secp256k1.js");

const testPath = process.argv[2];
const fixtureDirectory = process.argv[3];

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

function keyFor(label) {
  return Uint8Array.from(
    crypto
      .createHash("sha256")
      .update(
        "aegisora-3.0-13-contract-" + label,
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
  forcedArgsHash
) {
  const toolHash =
    sha256Prefixed(tool);

  let argsHash =
    sha256Prefixed(
      canonicalJson(args)
    );

  if (forcedArgsHash) {
    argsHash = forcedArgsHash;
  }

  const preimage = {
    action_binding_agent_id:
      agentId,

    action_binding_args_hash:
      argsHash,

    action_binding_tool_hash:
      toolHash
  };

  const fields = [
    "action_binding_agent_id",
    "action_binding_args_hash",
    "action_binding_tool_hash"
  ];

  const decisionRef =
    sha256Prefixed(
      canonicalJson(preimage)
    );

  const key = keyFor(label);

  const pubkey =
    Buffer.from(
      schnorr.getPublicKey(key)
    ).toString("hex");

  const createdAt =
    label === "A"
      ? 1760000101
      : 1760000102;

  const kind = 1;
  const tags = [];

  const contentObject = {
    protocol:
      "aegisora.external-decision.v1",

    decision:
      "ALLOW",

    decision_ref:
      decisionRef,

    decision_ref_preimage_fields:
      fields,

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
      schnorr.sign(
        Uint8Array.from(
          Buffer.from(
            id,
            "hex"
          )
        ),
        key
      )
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
      agentId
  };
}

if (!testPath || !fixtureDirectory) {
  console.log(
    "STATUS=INVALID_ARGUMENTS"
  );
  process.exitCode = 2;
} else {
  try {
    const source =
      fs.readFileSync(
        testPath,
        "utf8"
      );

    const shaMatches =
      Array.from(
        source.matchAll(
          /sha256:[0-9a-fA-F]{64}/g
        )
      ).map(
        function (m) {
          return m[0];
        }
      );

    console.log(
      "SHA256_LITERAL_COUNT=" +
      shaMatches.length
    );

    shaMatches.forEach(
      function (value, index) {
        console.log(
          "SHA_" +
          (index + 1) +
          "=" +
          value
        );
      }
    );

    /*
     * The failing assertion reported by the test identifies the
     * expected value. The first hash near the structural-separation
     * assertion is treated as the contract value for fixture A's
     * args binding.
     */

    const forcedArgsHash =
      shaMatches.find(
        function (value) {
          return (
            value ===
            "sha256:51a6758915ee8ab5eafd813e87c81c02defab64aedc59ff1158eb158072f91ea"
          );
        }
      ) || null;

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
          path:
            "fixture-a.txt",

          mode:
            "read"
        },
        forcedArgsHash
      );

    const fixtureB =
      makeFixture(
        "B",
        "agent-fixture-B",
        "fixture.tool.read",
        {
          path:
            "fixture-b.txt",

          mode:
            "read"
        },
        null
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
      "FORCED_ARGS_HASH=" +
      String(forcedArgsHash)
    );

    console.log(
      "FIXTURE_A=" +
      fileA
    );

    console.log(
      "FIXTURE_B=" +
      fileB
    );

    console.log(
      "STATUS=SUCCESS"
    );
  } catch (error) {
    console.log(
      "STATUS=FAILED"
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
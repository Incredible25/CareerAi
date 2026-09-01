import { afterEach, describe, expect, it } from "vitest";
import { getDeploymentStage, isBetaAccessEnabled, isBetaStage } from "@/lib/deployment";

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) saved[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("getDeploymentStage", () => {
  it("returns an explicit valid DEPLOYMENT_STAGE", () => {
    withEnv({ DEPLOYMENT_STAGE: "staging", NODE_ENV: "production" }, () => {
      expect(getDeploymentStage()).toBe("staging");
    });
    withEnv({ DEPLOYMENT_STAGE: "beta", NODE_ENV: "production" }, () => {
      expect(getDeploymentStage()).toBe("beta");
    });
  });

  it("ignores an invalid DEPLOYMENT_STAGE and falls back to NODE_ENV inference", () => {
    withEnv({ DEPLOYMENT_STAGE: "not-a-real-stage", NODE_ENV: "production" }, () => {
      expect(getDeploymentStage()).toBe("production");
    });
  });

  it("falls back to NODE_ENV inference when unset: production -> production", () => {
    withEnv({ DEPLOYMENT_STAGE: undefined, NODE_ENV: "production" }, () => {
      expect(getDeploymentStage()).toBe("production");
    });
  });

  it("falls back to NODE_ENV inference when unset: anything else -> development", () => {
    withEnv({ DEPLOYMENT_STAGE: undefined, NODE_ENV: "test" }, () => {
      expect(getDeploymentStage()).toBe("development");
    });
  });
});

describe("isBetaStage", () => {
  it("is true only when DEPLOYMENT_STAGE is exactly 'beta'", () => {
    withEnv({ DEPLOYMENT_STAGE: "beta" }, () => expect(isBetaStage()).toBe(true));
    withEnv({ DEPLOYMENT_STAGE: "staging" }, () => expect(isBetaStage()).toBe(false));
    withEnv({ DEPLOYMENT_STAGE: "production" }, () => expect(isBetaStage()).toBe(false));
  });
});

describe("isBetaAccessEnabled", () => {
  afterEach(() => {
    delete process.env.BETA_ACCESS_ENABLED;
  });

  it("defaults to enabled when unset", () => {
    delete process.env.BETA_ACCESS_ENABLED;
    expect(isBetaAccessEnabled()).toBe(true);
  });

  it("disables only on the exact literal string 'false'", () => {
    process.env.BETA_ACCESS_ENABLED = "false";
    expect(isBetaAccessEnabled()).toBe(false);
  });

  it("stays enabled for any other value, to avoid an accidental typo locking everyone out", () => {
    process.env.BETA_ACCESS_ENABLED = "0";
    expect(isBetaAccessEnabled()).toBe(true);
  });
});

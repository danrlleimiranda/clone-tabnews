import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";
import orchestrator from "tests/orchestrator";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without user", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });

    test("without user.features", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });

    test("with unknown features", async () => {
      const createdUser = await orchestrator.createUser({});
      expect(() => authorization.can(createdUser, "unknown:feature")).toThrow(
        InternalServerError,
      );
    });

    test("with valid user and known feature", async () => {
      const createdUser = { features: ["create:user"] };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without user", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });

    test("without user.features", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });

    test("with valid user but no resource", async () => {
      const createdUser = await orchestrator.createUser({});
      expect(() =>
        authorization.filterOutput(createdUser, "read:user"),
      ).toThrow(InternalServerError);
    });

    test("with valid user and known feature and resource", async () => {
      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00:000Z",
        updated_at: "2026-01-01T00:00:00:000Z",
        email: "resource@resource.com",
        password: "senha123",
      };
      const createdUser = { features: ["read:user"] };
      const results = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );
      expect(results).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00:000Z",
        updated_at: "2026-01-01T00:00:00:000Z",
      });
    });
  });
});

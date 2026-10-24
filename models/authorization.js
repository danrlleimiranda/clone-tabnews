import { InternalServerError } from "infra/errors";
const availableFeatures = [
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",
  "read:session",
  "create:session",
  "read:activation_token",
  "read:status",
  "read:status:all",
  "read:migration",
  "create:migration",
];
function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);
  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
  if (feature === "read:user:self") {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        expires_at: resource.expires_at,
      };
    }
  }

  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      used_at: resource.used_at,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }

  if (feature === "read:status") {
    return {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          ...(can(user, "read:status:all") && {
            version: resource.dependencies.database.version,
          }),
          max_connections: resource.dependencies.database.max_connections,
          used_connections: resource.dependencies.database.used_connections,
        },
      },
    };
  }

  if (feature === "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "create:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }
  return {};
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer user no model authorization",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma feature conhecida no model authorization",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um resource conhecida no model authorization.filterOutput",
    });
  }
}

const authorization = { can, filterOutput };

export default authorization;

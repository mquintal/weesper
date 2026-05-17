const migrations = [
  {
    version: 1,
    up: `CREATE TABLE IF NOT EXISTS recordings (
          id TEXT PRIMARY KEY NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          duration INTEGER NOT NULL,
          audioFilePath TEXT NOT NULL,
          transcribedText TEXT,
          enhancedText TEXT,
          shortcutVersionId TEXT NOT NULL,
          modelId TEXT NOT NULL,
          llmId TEXT,
          FOREIGN KEY (shortcutVersionId) REFERENCES shortcut_versions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS shortcuts (
          id TEXT PRIMARY KEY NOT NULL,
          currentVersion INTEGER NOT NULL,
          status TEXT CHECK( status IN ('enabled', 'disabled', 'deleted') ) DEFAULT 'enabled' NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS shortcut_versions (
          id TEXT PRIMARY KEY NOT NULL,
          shortcutId TEXT NOT NULL,
          version INTEGER NOT NULL,
          name TEXT NOT NULL,
          shortcut TEXT NOT NULL,
          prompt TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (shortcutId) REFERENCES shortcuts(id) ON DELETE CASCADE
        );
          `,
  },
]

export { migrations }

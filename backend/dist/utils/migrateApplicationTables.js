"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplicationTables = createApplicationTables;
const database_1 = __importDefault(require("./database"));
async function createApplicationTables() {
    try {
        console.log('Creating program_forms table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS program_forms (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        form_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(program_id)
      )
    `);
        console.log('Creating applications table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE
      )
    `);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_data JSONB NOT NULL DEFAULT '{}'::jsonb;`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS file_uploads JSONB DEFAULT '[]'::jsonb;`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS submission_reference VARCHAR(50);`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
        await database_1.default.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes TEXT;`);
        await database_1.default.query(`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS application_data JSONB;
    `);
        await database_1.default.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'applications' AND column_name = 'application_data'
        ) THEN
          -- Drop NOT NULL if set and add default for safety
          BEGIN
            EXECUTE 'ALTER TABLE applications ALTER COLUMN application_data DROP NOT NULL';
          EXCEPTION WHEN others THEN
            -- ignore if not set
            NULL;
          END;
          BEGIN
            EXECUTE 'ALTER TABLE applications ALTER COLUMN application_data SET DEFAULT ''{}''::jsonb';
          EXCEPTION WHEN others THEN
            NULL;
          END;
        END IF;
      END$$;
    `);
        await database_1.default.query(`
      DO $$
      DECLARE
        constraint_rec RECORD;
      BEGIN
        -- Try standard constraint name
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'applications' AND constraint_name = 'applications_status_check'
        ) THEN
          EXECUTE 'ALTER TABLE applications DROP CONSTRAINT applications_status_check';
        END IF;
        
        -- Try alternative constraint names
        FOR constraint_rec IN 
          SELECT constraint_name FROM information_schema.table_constraints 
          WHERE table_name = 'applications' AND constraint_name LIKE '%status%check%'
        LOOP
          BEGIN
            EXECUTE 'ALTER TABLE applications DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
          EXCEPTION WHEN others THEN
            CONTINUE;
          END;
        END LOOP;
      END$$;
    `);
        await database_1.default.query(`
      UPDATE applications 
      SET application_data = COALESCE(application_data, form_data)
      WHERE application_data IS NULL AND form_data IS NOT NULL;
    `);
        await database_1.default.query(`UPDATE applications SET status = 'draft' WHERE TRIM(LOWER(status)) = 'pending';`);
        await database_1.default.query(`UPDATE applications SET status = 'under_review' WHERE TRIM(LOWER(status)) = 'in_review';`);
        await database_1.default.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename='applications' AND indexname='applications_user_program_unique'
        ) THEN
          CREATE UNIQUE INDEX applications_user_program_unique ON applications(user_id, program_id);
        END IF;
      END$$;
    `);
        console.log('Creating application_notifications table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS application_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        reference VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Creating file_uploads table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
        field_name VARCHAR(100) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_url VARCHAR(1000),
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        file_content BYTEA,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Creating indexes...');
        await database_1.default.query(`ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);`);
        await database_1.default.query(`ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS file_content BYTEA;`);
        await database_1.default.query(`DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'file_uploads' AND column_name = 'file_path'
        ) THEN
          BEGIN
            EXECUTE 'ALTER TABLE file_uploads ALTER COLUMN file_path DROP NOT NULL';
          EXCEPTION WHEN others THEN
            NULL;
          END;
        END IF;
      END$$;`);
        console.log('Indexes and constraints setup completed');
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_program_forms_expires_at ON program_forms(expires_at);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_program_id ON applications(program_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_application_notifications_user_id ON application_notifications(user_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_application_notifications_read_at ON application_notifications(read_at);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_file_uploads_application_id ON file_uploads(application_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
    `);
        console.log('Application tables created successfully!');
    }
    catch (error) {
        console.error('Error creating application tables:', error);
        throw error;
    }
}
if (require.main === module) {
    createApplicationTables()
        .then(() => {
        console.log('Application tables migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateApplicationTables.js.map
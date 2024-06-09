const createTableSQL = `
CREATE TABLE IF NOT EXISTS student_details (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  about VARCHAR(255),
  website VARCHAR(255),
  instagram VARCHAR(255),
  twiter VARCHAR(20),
  facebook VARCHAR(255),
  youtube VARCHAR(255),
  tiktok VARCHAR(255),
  profileid VARCHAR(255),
  questionsid VARCHAR(255)
)
`;

const createAdminTableSQL = `
  CREATE TABLE IF NOT EXISTS admin_details (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) DEFAULT 'admin@admin.com',
    password VARCHAR(255) DEFAULT 'password'
  )
`;

const defaultAdminEntrySQL = `
  INSERT INTO admin_details (id) VALUES ('ca79e11b-0852-4b41-bdf5-7148a95cf4ee')
`;

module.exports = { defaultAdminEntrySQL, createAdminTableSQL, createTableSQL };

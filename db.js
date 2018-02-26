import mysql from 'promise-mysql';

let pool = mysql.createPool({
	connectionLimit: process.env.DB_CONN_LIMIT,
	database: process.env.DB_SCHEMA,
	debug: process.env.DEBUG,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	multipleStatements: true,
	password: process.env.DB_PASS,
	user: process.env.DB_USER,
})
exports = module.exports = {}

let debug = false

export const setDebug = status => debug = status

export const resolve = async (text, patch_id) => {
	if (debug) {
		return true
	} else {
		// update patch status
		await pool.query(`
			UPDATE patch
			SET text=?,
			ambiguous=0,
			status=1
			WHERE id=?;
		`, [text, patch_id]);
		// update correct users
		await pool.query(`
			UPDATE user
			SET patches_correct = patches_correct + 1
			WHERE id IN (
				SELECT user_id
				FROM patch_user
				WHERE text=?
				AND patch_id=?
			)
		`, [text, patch_id]);

		// delete rows
		await pool.query(`
			DELETE FROM
			patch_user
			WHERE patch_id=?
		`, [patch_id]);
		return true
	}
}

export const next = async () => {
	if (debug) {
		return [
			{patch_id: 1, path: "3.jpg", text: "test"},
			{patch_id: 1, path: "3.jpg", text: "test2"},
			{patch_id: 1, path: "3.jpg", text: "test3"}
		]
	} else {
		let results = await pool.query(`
			SELECT patch.id as patch_id, patch.path as path, patch_user.text as text
			FROM patch
			LEFT JOIN patch_user
			ON patch_user.patch_id = patch.id
			WHERE patch.ambiguous=1
			ORDER BY patch.id
			LIMIT 3;
		`);
		return results
	}
}
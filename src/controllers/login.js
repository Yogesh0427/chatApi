const pool = require("../config/pool");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields required"
      });
    }

    const result = await pool.query(
      `SELECT * FROM admin_user 
       WHERE LOWER(email) = LOWER($1) OR mobile = $1
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // 🔒 check lock
    if (user.lock_until && Number(user.lock_until) > Date.now()) {
      const remainingTime = Math.ceil(
        (Number(user.lock_until) - Date.now()) / 1000
      );

      return res.status(403).json({
        message: "Account locked",
        remainingTime
      });
    }

    // ❌ wrong password
    if (user.password !== password) {
      let attempts = Number(user.login_attempts || 0) + 1;

      if (attempts >= 3) {
        const lockTime = Date.now() + 5 * 60 * 1000;

        await pool.query(
          `UPDATE admin_user 
           SET login_attempts = 0, lock_until = $1 
           WHERE id = $2`,
          [lockTime, user.id]
        );

        return res.status(403).json({
          message: "Account locked",
          remainingTime: 300
        });
      }

      await pool.query(
        `UPDATE admin_user 
         SET login_attempts = $1 
         WHERE id = $2`,
        [attempts, user.id]
      );

      return res.status(401).json({
        message: `Invalid password (${attempts}/3)`
      });
    }

    // ✅ success
    await pool.query(
      `UPDATE admin_user 
       SET login_attempts = 0, lock_until = NULL 
       WHERE id = $1`,
      [user.id]
    );

    delete user.password;

    return res.status(200).json({
      message: "Login successful",
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields required"
      });
    }

    const query = `
      SELECT *
      FROM users 
      WHERE (email = $1 or mobile=$2) AND password = $3
    `;

    const result = await pool.query(query, [email,email,password])

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};


exports.userSignup = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    
    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({
        message: "All fields required"
      });
    }

    // 🔍 Check if user exists
    const checkQuery = `
      SELECT id FROM users WHERE email = $1 OR mobile = $2
    `;
    const checkResult = await pool.query(checkQuery, [email, mobile]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        message: "Email or mobile already registered"
      });
    }

    // ✅ Insert new user
    const insertQuery = `
      INSERT INTO users (name, email, mobile, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, role
    `;

    const insertResult = await pool.query(
      insertQuery,
      [name, email, mobile, password, role]
    );

    const user = insertResult.rows[0];

    // 👇 AUTO CREATE CHAT USER
    await pool.query(
      "INSERT INTO chat_users(user_id, name, role) VALUES($1, $2, $3)",
      [user.id, user.name, user.role]
    );

    return res.status(201).json({
      message: "Signup successful",
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}
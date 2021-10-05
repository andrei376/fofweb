module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {
    user_id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    user_name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    user_password_hash: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    user_level: {
      type: Sequelize.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    user_prefs: {
      type: Sequelize.TEXT('long'),
      allowNull: true
    }
  }, {
    tableName: "fof_user",
    timestamps: false
  });

  return User;
};

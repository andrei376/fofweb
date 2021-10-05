module.exports = (sequelize, Sequelize) => {
  const Tag = sequelize.define("Tag", {
    tag_id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    tag_name: {
      type: Sequelize.STRING(100),
      allowNull: false
    }
  }, {
    tableName: "fof_tag",
    timestamps: false
  });

  return Tag;
};

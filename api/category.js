const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const sequelize = require("../util/database");

router.get("/:locationName/:partnerId", async (req, res) => {
  const partnerFullName = req.params.partnerId.split("-").join(" ");
  return sequelize
    .query(
      `SELECT catTrans.name as categoryTranslationName, catTrans.languageId as categoryTranslationLanguageId
      FROM restaurants as ad
      INNER JOIN productCategories as cat
      ON ad.id = cat.restaurantId
      INNER JOIN productCategoryTranslations as catTrans
      ON cat.id = catTrans.productCategoryId
      where catTrans.languageId =2 and ad.fullName LIKE '%${partnerFullName}%'
        `,
      { type: Sequelize.QueryTypes.SELECT }
    )
    .then((results) => {
      return res.json(results);
    });
});

module.exports = router;

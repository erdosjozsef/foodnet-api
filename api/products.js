const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Variant = require("../models/Variant");
const ProductFinal = require("../models/ProductFinal");
const Products = require("../models/Product");
const ProductTranslation = require("../models/ProductTranslation");
const Property = require("../models/Property");
const PropertyValues = require("../models/PropertyValue");
const PropertyValueTranslations = require("../models/PropertyValueTranslation");
const ProductHasAllergen = require("../models/ProductHasAllergen");
const Allergen = require("../models/Allergen");
const AllergenTranslation = require("../models/AllergenTranslation");
const VariantPropertyValue = require("../models/VariantPropertyValue");
const Box = require("../models/Box");
const ProductVariantsExtras = require("../models/ProductVariantsExtras");
const Extras = require("../models/Extra");
const ExtraHasAllergen = require("../models/ExtraHasAllergen");
const ExtraTranslation = require("../models/ExtraTranslation");

router.post("/optional-extra", async (req, res) => {
  const restaurantId = req.body.restaurantId;
  const variantId = req.body.variantId;
  const lang = req.body.lang;
  let languageCode;

  if (lang == "ro") {
    languageCode = 1;
  } else if (lang == "hu") {
    languageCode = 2;
  } else if (lang == "en") {
    languageCode = 3;
  } else {
    return res.json({
      status: 404,
      msg: "Language not found",
      result: [],
    });
  }
  try {
    const resultsList = await ProductVariantsExtras.findAll({
      where: { variantId: variantId, restaurantId: restaurantId, active: 1 },
      include: [
        {
          model: Extras,
          include: [
            {
              model: ExtraTranslation,
              where: { languageId: languageCode },
            },
            {
              model: ExtraHasAllergen,
              where: { active: 1 },
              include: [
                {
                  model: Allergen,
                  include: [
                    {
                      model: AllergenTranslation,
                      where: { languageId: languageCode },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    let resultArr = [];

    for (let i = 0; i <= resultsList.length - 1; i++) {
      lengthExtraHasAllergens = resultsList[i].Extra.ExtraHasAllergens;
      for (let j = 0; j < lengthExtraHasAllergens.length; j++) {
        const items = {
          extra_id: resultsList[i].Extra.id,
          extra_name: resultsList[i].Extra.ExtraTranslations[0].name,
          extra_minQuantity: resultsList[i].quantityMin,
          extra_price: resultsList[i].price,
          extra_maxQuantity: resultsList[i].quantityMax,
          allergen:
            lengthExtraHasAllergens[j].Allergen.AllergenTranslations[0].name,
        };
        resultArr.push(items);
      }
    }

    const merged = resultArr.reduce(
      (
        r,
        {
          extra_id,
          extra_name,
          extra_minQuantity,
          extra_price,
          extra_maxQuantity,
          ...rest
        }
      ) => {
        const key = `${extra_id}-${extra_name}-${extra_minQuantity}-${extra_price}-${extra_maxQuantity}`;
        r[key] = r[key] || {
          extra_id,
          extra_name,
          extra_minQuantity,
          extra_price,
          extra_maxQuantity,
          allergens_name: [],
        };
        r[key]["allergens_name"].push(rest);
        return r;
      },
      {}
    );

    const result = Object.values(merged);

    return res.json({
      status: 200,
      msg: "Optional extra list successfully listed",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      msg: "Server error",
      result: [],
    });
  }
});

router.post("/subcategories-products", async (req, res) => {
  const restaurantId = req.body.restaurantId;
  const resultWithAll = [];
  const lang = req.body.lang;

  let languageCode;
  if (lang == "ro") {
    languageCode = 1;
  } else if (lang == "hu") {
    languageCode = 2;
  } else if (lang == "en") {
    languageCode = 3;
  } else {
    return res.json({
      status: 404,
      msg: "Language not found",
      result: [],
    });
  }
  const propertyValueId = req.body.subcategoryId;
  const propValId = req.body.propertyValTransId;

  var categoryId = req.body.categoryId;
  try {
    const resultsList = await Property.findAll({
      where: { id: propertyValueId, restaurantId: restaurantId },
      include: [
        {
          model: PropertyValues,
          include: [
            {
              model: PropertyValueTranslations,
              where: {
                propertyValueId: propValId,
                languageId: languageCode,
              },
            },
            {
              model: VariantPropertyValue,
              where: { propertyValueId: propValId },
              include: [
                {
                  model: Variant,
                  where: { categoryId: categoryId },
                  include: [
                    {
                      model: ProductFinal,

                      where: { active: 1 },

                      include: [
                        {
                          model: Products,

                          include: [
                            {
                              model: ProductTranslation,

                              where: {
                                languageId: languageCode,
                                title: {
                                  [Op.like]: `%${req.body.searchProduct}%`,
                                },
                              },
                            },
                            {
                              model: ProductHasAllergen,
                              where: { active: 1 },
                              include: [
                                {
                                  model: Allergen,
                                  include: [
                                    {
                                      model: AllergenTranslation,
                                      where: { languageId: languageCode },
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          model: Box,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    try {
      let newJ;
      let productHasAllergen = [];
      for (let i = 0; i < resultsList.length; i++) {
        let propVal = resultsList[i].PropertyValues[i].VariantPropertyValues;

        for (let j = 0; j < propVal.length; j++) {
          if (propVal[j].Variant.ProductFinals[0].Product != null) {
            productHasAllergen =
              propVal[j].Variant.ProductFinals[0].Product.ProductHasAllergens;
            newJ = j;
          }

          let box_id;
          let box_price;

          if (propVal[j].Variant.ProductFinals[0].Box !== null) {
            box_id = propVal[j].Variant.ProductFinals[0].Box.id;
            box_price = propVal[j].Variant.ProductFinals[0].Box.price;
          }
          for (let k = 0; k < productHasAllergen.length; k++) {
            let finalAllName = [];
            finalAllName =
              productHasAllergen[k].Allergen.AllergenTranslations[0].name;

            const items = {
              box_id: box_id,
              box_price: box_price,
              startTime:
                propVal[newJ].Variant.ProductFinals[0].Product.startTime,
              endTime: propVal[newJ].Variant.ProductFinals[0].Product.endTime,
              product_id: propVal[newJ].Variant.ProductFinals[0].productId,
              variant_id: propVal[newJ].Variant.id,
              soldOut: propVal[newJ].Variant.ProductFinals[0].Product.soldOut,
              active: propVal[newJ].Variant.ProductFinals[0].Product.active,

              product_name:
                propVal[newJ].Variant.ProductFinals[0].Product
                  .ProductTranslations[0].title,
              allergen_name: finalAllName,
              product_description:
                propVal[newJ].Variant.ProductFinals[0].Product
                  .ProductTranslations[0].description,
              product_price: propVal[newJ].Variant.ProductFinals[0].price,
              product_imageUrl:
                propVal[newJ].Variant.ProductFinals[0].Product.productImagePath,
            };
            resultWithAll.push(items);
          }
        }
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: 404,
        msg: "Product not found",
        result: [],
      });
    }

    const merged = resultWithAll.reduce(
      (
        r,
        {
          product_id,
          product_name,
          product_description,
          product_price,
          product_imageUrl,
          variant_id,
          box_id,
          box_price,
          soldOut,
          startTime,
          endTime,
          active,
          ...rest
        }
      ) => {
        const key = `${product_id}-${active}-${startTime}-${endTime}-${soldOut}-${variant_id}-${product_name}-${product_description}-${product_price}-${product_imageUrl}-${box_id}-${box_price}`;
        r[key] = r[key] || {
          product_id,
          variant_id,
          box_id,
          soldOut,
          box_price,
          product_name,
          product_description,
          product_price,
          product_imageUrl,
          startTime,
          endTime,
          active,
          allergens_name: [],
        };
        r[key]["allergens_name"].push(rest);
        return r;
      },
      {}
    );

    const result = Object.values(merged);

    res.json({
      status: 200,
      msg: "Products list successfully listed",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      msg: "Server error",
      result: [],
    });
  }
});

module.exports = router;

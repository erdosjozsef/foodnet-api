const express = require("express");
const router = express.Router();
const UserDeliveryAddress = require("../models/UserDeliveryAddress");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

// @route    POST api/delivery address
// @desc     Create delivery address
// @access   Private
router.post(
  "/",
  [
    check("city", "City is required").isLength({ min: 2, max: 50 }),
    check("street", "Street is required").isLength({ min: 2, max: 100 }),
    check("houseNumber", "House number is required").isLength({
      min: 1,
      max: 20,
    }),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        status: 400,
        msg: "Invalid credentials",
        result: [],
      });
    }
    const { city, street, houseNumber, floor, doorNumber, locationNameId } =
      req.body;

    try {
      const result = await UserDeliveryAddress.create({
        city: city,
        street: street,
        houseNumber: houseNumber,
        floor: floor,
        doorNumber: doorNumber,
        locationNameId: locationNameId,
        userId: req.user.id,
      });

      return res.json({
        status: 200,
        msg: "Delivery address successfully created",
        result,
      });
    } catch (err) {
      console.log(err);
      return res.json({
        status: 500,
        msg: "Server error",
        result: [],
      });
    }
  }
);

module.exports = router;

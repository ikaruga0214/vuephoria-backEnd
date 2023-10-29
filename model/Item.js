import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  cost: {
    type: Number,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
});

const Item = mongoose.model("item", ItemSchema);

export default Item;

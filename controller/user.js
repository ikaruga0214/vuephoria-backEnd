import User from "../model/User";

export const addUser = async (req, res) => {
  try {
    User.insertMany([
      {
        name: "AYAYA",
      },
    ]);
  } catch (err) {}
};

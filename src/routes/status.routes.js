const checkStatus = (req, res) => {
  res.send({message: 'Server online'});
};

export const statusRoutes = {
  checkStatus
};

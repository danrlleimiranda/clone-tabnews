function status(req, res) {
return res.status(200).json({ status: "OK" })
}

export default status;
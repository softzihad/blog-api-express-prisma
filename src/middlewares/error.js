export function notFound(req, res, next) {
    return res.status(404).json({ message: "Not found" });
}

export function errorHandler(err, req, res, next) {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Server error" });
}
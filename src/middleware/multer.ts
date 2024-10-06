import multer from "multer";
import {v4 as uuid} from 'uuid'

// export const singleUpload = multer().single("photo");
// export const mutliUpload = multer().array("photos", 5);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, "uploads");
    },
    filename(req, file, callback) {
        const id = uuid();
        const extensionName = file.originalname.split(".").pop()
        callback(null, `${id}.${extensionName}`)
    }
})
export const signleUpload = multer({storage}).single("photo")
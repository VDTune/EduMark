import fs from 'fs'
import path from 'path'
import axios from 'axios'

export const ensureLocalImage = async (imagePathOrUrl) => {
    // Nếu đã là file local → dùng luôn
    if (!imagePathOrUrl.startsWith('http')) {
        return imagePathOrUrl
    }

    // Tạo thư mục uploads/temp nếu chưa có
    const tempDir = path.join(process.cwd(), 'uploads', 'temp')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }

    // Tạo file tạm
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const localPath = path.join(tempDir, fileName)

    // Download ảnh từ URL
    const response = await axios.get(imagePathOrUrl, {
        responseType: 'stream',
    })

    const writer = fs.createWriteStream(localPath)
    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })

    return localPath
}

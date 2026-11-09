import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let size = 512
let colorSpace = CGColorSpaceCreateDeviceRGB()
let context = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8,
                        bytesPerRow: size * 4, space: colorSpace,
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
context.setAllowsAntialiasing(true)
let tile = CGPath(roundedRect: CGRect(x: 24, y: 24, width: 464, height: 464), cornerWidth: 108, cornerHeight: 108, transform: nil)
context.addPath(tile)
context.clip()
let gradient = CGGradient(colorsSpace: colorSpace, colors: [
    CGColor(red: 0.20, green: 0.40, blue: 0.97, alpha: 1),
    CGColor(red: 0.06, green: 0.12, blue: 0.38, alpha: 1)
] as CFArray, locations: [0, 1])!
context.drawLinearGradient(gradient, start: CGPoint(x: 60, y: 470), end: CGPoint(x: 460, y: 40), options: [])
context.setStrokeColor(CGColor(red: 0.51, green: 0.76, blue: 1, alpha: 0.65))
context.setLineWidth(9)
context.strokeEllipse(in: CGRect(x: 100, y: 146, width: 274, height: 274))
context.strokeEllipse(in: CGRect(x: 175, y: 146, width: 124, height: 274))
context.move(to: CGPoint(x: 101, y: 283)); context.addLine(to: CGPoint(x: 373, y: 283)); context.strokePath()
for y in [220.0, 346.0] {
    context.move(to: CGPoint(x: 119, y: y)); context.addQuadCurve(to: CGPoint(x: 355, y: y), control: CGPoint(x: 237, y: y - 22)); context.strokePath()
}
context.setShadow(offset: CGSize(width: 0, height: -8), blur: 25, color: CGColor(gray: 0, alpha: 0.35))
context.setFillColor(CGColor(red: 0.97, green: 0.99, blue: 1, alpha: 1))
context.fillEllipse(in: CGRect(x: 228, y: 88, width: 196, height: 196))
context.setShadow(offset: .zero, blur: 0)
context.setStrokeColor(CGColor(red: 0.08, green: 0.19, blue: 0.43, alpha: 1))
context.setLineWidth(13); context.setLineCap(.round)
context.move(to: CGPoint(x: 326, y: 246)); context.addLine(to: CGPoint(x: 326, y: 186)); context.addLine(to: CGPoint(x: 365, y: 163)); context.strokePath()
context.setFillColor(CGColor(red: 0.17, green: 0.40, blue: 0.96, alpha: 1))
context.fillEllipse(in: CGRect(x: 316, y: 176, width: 20, height: 20))
let image = context.makeImage()!
let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("assets/extension-icon.png")
let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, image, nil)
CGImageDestinationFinalize(destination)

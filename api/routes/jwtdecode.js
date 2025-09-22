import { jwtDecode } from "jwt-decode";

const token = "f89249d131cf8d0811f6fdc86be3f84bc12bce3a653d630ebd781ded77c637ce030833d77911a629c976906e51eddd6085d345bfa703688e4181e944576d7a92";
const decoded = jwtDecode(token);

console.log(decoded);

/* prints:
 * {
 *   foo: "bar",
 *   exp: 1393286893,
 *   iat: 1393268893
 * }
 */

// decode header by passing in options (useful for when you need `kid` to verify a JWT):
const decodedHeader = jwtDecode(token, { header: true });
console.log(decodedHeader);

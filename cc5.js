/*
 * cc5 symmetric cipher encryption/decryption
 *
 * @license Public Domain
 * @param string key - secret key for encryption/decryption
 * @param string str - string to be encrypted/decrypted
 * @return string
 */
function cc5(str) {
	key = "F2cQx5iu8LKGQ";
	var s = [], j = 0, x, res = '';
	for (var i = 0; i < 256; i++) {
		s[i] = i;
	}
	for (i = 0; i < 256; i++) {
		j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
		x = s[i];
		s[i] = s[j];
		s[j] = x;
	}
	i = 0;
	j = 0;
	for (var y = 0; y < str.length; y++) {
		i = (i + 1) % 256;
		j = (j + s[i]) % 256;
		x = s[i];
		s[i] = s[j];
		s[j] = x;
		res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
	}
	/*
	if (res.indexOf("red") >= 0 || res.indexOf("blue") >= 0) {
		res = str.replace(/red/g, "'");
		res = str.replace(/blue/g, '"');
	} else {
		res = str.replace(/'/g, "red");
		res = str.replace(/"/g, "blue");
	}
	*/
	return res;
}
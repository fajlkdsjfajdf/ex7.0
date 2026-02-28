// tk站解析视频


function myparseInt(n, r){
	//将文字转为16或10进制的数组
	let t = /^0[xX]/;
	let ce = "	\n\f\r   ᠎             　\u2028\u2029\ufeff";
	let de = "[" + ce + "]";
	let pe = new RegExp("^" + de + de + "*");
	let me = new RegExp(de + de + "*$");
	let o = String(n).replace(pe, "").replace(me, "");
	let i = Number(r) || (t.test(o) ? 16 : 10);
	return parseInt(o, i);
}

function getLicenseCode(license_code){
	let f="";
	for(let g =1; g<license_code.length;g++){
		f += myparseInt(license_code[g])? myparseInt(license_code[g]): 1;
	}
	return f;
}

function getCode1(license_code){
	let license_code2 = getLicenseCode(license_code);
	let j = parseInt(license_code2.length/2);
	let k = myparseInt(license_code2.substring(0, j+ 1));
	let l = myparseInt(license_code2.substring(j));
	let g = Math.abs(l -k);
	let f = g;
	g = Math.abs(k - l);
	f += g;
	f *= 2;
	f = "" +f ;
	i = myparseInt(pixed) / 2 + 2;
	m = "";
	for (g = 0; g< j + 1; g++){
		for( h = 1; h<=4; h++){
			n = myparseInt(license_code[g + h]) + myparseInt(f[g]);
			if(n >= i)
				n -= i;
			//console.log(n + "   " + m);
			m += n;
		}
	}


	return m;
}

function getCode2(code, code1){
	let h =code.substring(0, 2 * myparseInt(pixed));
	let i = code1;
	for (var j = h, k = h.length - 1; k >= 0; k--) {
		for (var l = k, m = k; m < i.length; m++)
			l += myparseInt(i[m]);
		for (; l >= h.length;)
			l -= h.length;
		for (var n = "", o = 0; o < h.length; o++)
			n += o == k ? h[l] : o == l ? h[k] : h[o];
		h = n
		//console.log(h);
	}
	code = code.replace(j, h);
	return code;
}

function getTkVideoUrl(url) {
    //function/0/https://tktube.com/get_file/35/be966d1fe22e7b99cb41bb826356319d0edb65a913/167000/167339/167339_720p.mp4/
	let index = url.indexOf("https:");
	if(index>=0){
		 let new_url = url.slice(index);
		 let code = new_url.split("/")[5];
		 let code1 = getCode1(license_code);
		 let code2 = getCode2(code, code1);

		 return new_url.replace(code, code2);
	}
	return "";

}

var pixed = "16px";
//let code = "ef0175994996b27a049639dfa276c223080c6472fe";
//let code = "be966d1fe22e7b99cb41bb826356319d0edb65a913";
var license_code = "$432515114269431";


// let url ="function/0/https://tktube.com/get_file/35/be966d1fe22e7b99cb41bb826356319d0edb65a913/167000/167339/167339_720p.mp4/";
// let new_url =getVideoUrl(url);
// console.log(new_url);
//function/0/https://tktube.com/get_file/35/be966d1fe22e7b99cb41bb826356319d0edb65a913/167000/167339/167339_720p.mp4/
//https://tktube.com/get_file/35/91b964c26de6682fb3e1bd1972b5be390edb65a913/167000/167339/167339_720p.mp4
// code1 = getCode1(license_code);
// console.log(code1);
//
// code2 = getCode2(code, code1);
// console.log(code2);



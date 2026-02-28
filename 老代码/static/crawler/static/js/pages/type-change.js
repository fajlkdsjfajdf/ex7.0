////////////////////////////////实行replaceAll/////////////////////////////////
String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

////////////////////////////////通过字典格式话字符串/////////////////////////////////
function StringFormatByDict(s, dict){
    if(typeof s === 'string'){
        for(let key in dict){
            s = s.replaceAll("{"+key+"}", dict[key]);
        }
        return s;
    }
    else{
        return s;
    }
}


///////////////////////////////////判断指定index是否在数组中，不在返回""////////////////
function getOneValue(list, key){
    if (key in list){
        return list[key];
    }
    else
        return null;
}

////////////////////////////////////trim移除指定的左右///////////////
function trim(s, t=" "){
    s = s.trim();
    if(s[0] == t){
        s = s.substring(1);
        return trim(s, t)
    }
    if(s[s.length-1] == t){
        s = s.substring(0, s.length -1);
        return trim(s, t)
    }
    return s;

}







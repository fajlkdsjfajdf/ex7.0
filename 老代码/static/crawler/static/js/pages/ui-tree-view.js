$( document ).ready(function() {

    // Ajax
    $('#ajaxTree').jstree({
		'core' : {
			'check_callback' : true,
			'themes' : {
				'responsive': false
			},
            'data' : {
                'url' : function (node) {
                    let url = "/set?cls=ZhengliStatus&type=getfiles";

                    if(node.id != "#"){
                        if(node.parents.length >= 2){
                            console.log(node.parents);
                            // for(let i=node.parents.length-2; i--; i>=0){
                            //     console.log(node.parents[i]);
                            // }
                            let text = "";
                            for(let i=0;i<node.parents.length-1;i++){
                                text = node.parents[i] + "/" +text;
                            }
                            text = text + node.text;
                            url = "/set?cls=ZhengliStatus&type=getfiles&node=" + encodeURIComponent(text);
                        }
                        else{
                            url = "/set?cls=ZhengliStatus&type=getfiles&node=" + encodeURIComponent(node.text);
                        }

                    }
                    return url;
                },
                'data' : function (node) {
                    return { 'id' : node.id };
                }
            }
        },
        "types" : {
            'default' : {
                'icon' : 'fa fa-folder icon-state-info icon-md'
            },
            'file' : {
                'icon' : 'fa fa-file icon-state-default icon-md'
            }
        },
        "plugins" : [ "contextmenu", "dnd", "search", "state", "types", "wholerow" ]
    });
});
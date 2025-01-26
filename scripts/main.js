const visaContainer = document.getElementById("visa_container");
const inputsContainer = document.getElementById("inputs_container");

const fieldIds = ["mrz_1","mrz_2","visa_number","name","first_name","avatar","tutor","gender","nationality","birth_date","visa_type","delivery_place","delivery_date","duration","start_date","end_date","domain","entries"]

const citizens=[{name:"BARBIER--RENARD Emile",id:0,initials:"BE"},{name:"DROUOT THOMAS",id:1,initials:"DT"},{name:"PAULET Antoine",id:2,initials:"PA"}];

function getBase64Image(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
}

function loadSVGElement(path){
	const xhr = new XMLHttpRequest();
	xhr.open("GET",path,false);
	return new Promise((resolve,reject)=>{
		xhr.onload = function(e) {
		  resolve(xhr.responseXML.documentElement);
		};
		xhr.onerror = function(e) {
		  reject(e);
		};
		xhr.send(null);
	});
}

function saveFile(blob, filename) {
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0)
  }
}

function checksum(str){
	const weights = [7,3,1];
	let sum = 0;
	let acc = 0;
	[...str].forEach(c => {
		acc = acc%3;
		const weight = weights[acc];
		acc++;
		if(c == '<'){
			return;
		}
		if(isNaN(c)){
			sum+=(c.charCodeAt(0)-65)*weight;
			return;
		}
		sum+=parseInt(c)*weight;
	});
	return (sum%10).toString();
}

function unescapeHtml(htmlStr) {
    htmlStr = htmlStr.replace(/&lt;/g , "<");	 
    htmlStr = htmlStr.replace(/&gt;/g , ">");     
    htmlStr = htmlStr.replace(/&quot;/g , "\"");  
    htmlStr = htmlStr.replace(/&#39;/g , "\'");   
    htmlStr = htmlStr.replace(/&amp;/g , "&");
    return htmlStr;
}
function escapeMrz(str) {
	str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    str = str.replace(/[^A-Z0-9]/g, "<");
    str = str.replace(/<+/g , "<");
    return str;
}
function escapeMrzDate(date){
    return date.substring(8)+date.substring(3,5)+date.substring(0,2);
}
function escapeHtml(unsafeStr)
{
    return unsafeStr
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function enforceCaps(input){
	input.value = input.value.toUpperCase();
}

function getRadio(label_name, name, value_labels, values, init_value, on_change=null, id=""){
	const label = document.createElement("label");
	label.innerText=label_name;
	
	const radioDiv = document.createElement('div');
	radioDiv.classList.add('radio');
	values.forEach((value,i)=>{
		const inputLabel = document.createElement("label");
		inputLabel.innerText=value_labels[i];
		
		const radioInput = document.createElement('input');

		radioInput.type = "radio";
		radioInput.name = name;
		radioInput.value = value;
		radioInput.checked=(value==init_value);
		
		
		radioInput.addEventListener("input", on_change(value));
		
		inputLabel.appendChild(radioInput);
		radioDiv.appendChild(inputLabel);
	});
	label.appendChild(radioDiv);
	
	return {label:label,input:radioDiv};
}

function getTextInput(label_name,value, on_change=null, id="",maxlength=false){
	const label = document.createElement("label");
	label.innerText=label_name;
	const element = document.createElement("input");
	element.type = "text";
	element.value = value;
	element.autocomplete = "off";
	element.id = id;
	if(on_change!==null){
		element.addEventListener("input", on_change(element));
	}
	if(maxlength){
		element.maxLength = maxlength.toString();
	}
	label.appendChild(element);
	return {label:label,input:element};
}

function getPhotoInput(label_name, on_change=null, id=""){
	const label = document.createElement("label");
	label.innerText=label_name;
	const element = document.createElement("input");
	element.type = "file";
	element.autocomplete = "off";
	element.id = id;
	element.accept = "image/png, image/jpeg";
	if(on_change!==null){
		element.addEventListener("input", on_change(element));
	}
	label.appendChild(element);
	return {label:label,input:element};
}


function getIntInput(label_name, value, on_change=null, id=""){
	const label = document.createElement("label");
	label.innerText=label_name;
	const element = document.createElement("input");
	element.type = "number";
	element.id = id;
	element.lang = "en_EN";
	element.min = "0";
	element.max = "999";
	element.step="1";
	element.value = value;
	if(on_change!==null){
		element.addEventListener("input", on_change(element));
	}
	label.appendChild(element);
	return {label:label,input:element};
}

function escapeDate(date){
	return date.substring(6) + '-' +  date.substring(3,5)  + '-' +  date.substring(0,2);
}
function unescapeDate(date){
	return date.substring(8) + '/' +  date.substring(5,7)  + '/' +  date.substring(0,4);
}

function getDateInput(label_name,value, on_change=null, id=""){
	const label = document.createElement("label");
	label.innerText=label_name;
	const element = document.createElement("input");
	element.type = "date";
	element.value = escapeDate(value);
	element.autocomplete = "off";
	element.id = id;
	if(on_change!==null){
		element.addEventListener("input", on_change(element));
	}
	label.appendChild(element);
	return {label:label,input:element};
}


loadSVGElement('/resources/visa.svg').then((visa_svg)=>{
	visaContainer.appendChild(visa_svg);
	
	const visaFields = {};
	const visaPhotoArea = document.getElementById("photo");
	var visaPhoto = null;
	
	fieldIds.forEach((id)=>{
		visaFields[id]=document.getElementById(id).children[0]
	});
	
	const inputs={}
	
	function onTextInputChange(field,mrz_id=0,mrz_pos=0,mrz_len=0,linked_field=false,linked_first=false){
		return function(input){
			return function(e){
				enforceCaps(input);
				visaFields[field].innerHTML = input.value;
				if(mrz_id){
					
					let escaped_str = escapeMrz(input.value);
					
					if(linked_field){
						const linked_str = escapeMrz(inputs[linked_field].input.value);
						escaped_str = linked_first ? (linked_str + "<<" + escaped_str) : (escaped_str+"<<"+linked_str);
					}
					const replacement = escaped_str.substring(0,mrz_len).padEnd(mrz_len,'<');
					const mrz_field = visaFields['mrz_'+mrz_id];
					const mrz_text = unescapeHtml(mrz_field.innerHTML);
					mrz_field.innerHTML = escapeHtml(mrz_text.substring(0,mrz_pos)+replacement+mrz_text.substring(mrz_pos+mrz_len));
				}
			}
		}
	}
	
	function updateVisaType(num_days){
		const visaType = (num_days>90) ? 'D' : 'C';
		
		visaFields['visa_type'].innerHTML = visaType;
		
		const mrz_text = unescapeHtml(visaFields['mrz_1'].innerHTML);
		visaFields['mrz_1'].innerHTML=escapeHtml(mrz_text.substring(0,1)+visaType+mrz_text.substring(2));
	}
	
	function update_duration(){
		const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
		const startDate = new Date(inputs["start_date"].input.value);
		const endDate = new Date(inputs["end_date"].input.value);

		const num_days = Math.round(Math.abs((startDate - endDate) / oneDay))+1;
		
		visaFields['duration'].innerHTML = num_days;
		
		updateVisaType(num_days);
	}
	
	function onDateInputChange(field,mrz_id=0,mrz_pos=0){
		return function(input){
			return function(e){
				enforceCaps(input);
				visaFields[field].innerHTML = unescapeDate(input.value);
				if(mrz_id){
					const replacement = escapeMrzDate(unescapeDate(input.value));
					const mrz_field = visaFields['mrz_'+mrz_id];
					const mrz_text = unescapeHtml(mrz_field.innerHTML);
					mrz_field.innerHTML = escapeHtml(mrz_text.substring(0,mrz_pos)+replacement+checksum(replacement)+mrz_text.substring(mrz_pos+7));
				}
				if(field=="start_date" || field=="end_date"){
					update_duration();
				}
			}
		}
	}
	
	function onRadioInputChange(field,mrz_id=0,mrz_pos=0,mrz_len=0,linked_mrz_len=false){
		return function(value){
			return function(e){
				const mrz_field = visaFields['mrz_'+mrz_id];
				const mrz_text = unescapeHtml(mrz_field.innerHTML);
				let escaped_str = escapeMrz(value).substring(0,mrz_len).padEnd(mrz_len,'<');
				let beg_pos = mrz_pos;
				let replace_len = mrz_len;
				if(linked_mrz_len){
					const linked_str = linked_mrz_len<0 ? escapeMrz(mrz_text.substring(mrz_pos+linked_mrz_len,mrz_pos)) : escapeMrz(mrz_text.substring(mrz_pos+mrz_len,mrz_pos+mrz_len+linked_mrz_len));
					escaped_str=linked_mrz_len<0 ? linked_str+escaped_str+checksum(linked_str+escaped_str) : escaped_str+linked_mrz_len+checksum(escaped_str+linked_str)
					beg_pos += linked_mrz_len<0 ? linked_mrz_len : 0;
					replace_len = replace_len+Math.abs(linked_mrz_len)+1;
				}
				mrz_field.innerHTML = escapeHtml(mrz_text.substring(0,beg_pos)+escaped_str+mrz_text.substring(beg_pos+replace_len));
			}
		}
	}
	
	function onTutorInputChange(){
		return function(tutor_id){
			return function(e){
				visaFields["visa_number"].innerHTML = tutor_id + escapeMrz(visaFields["visa_number"].innerHTML).substring(1);
				visaFields["tutor"].innerHTML = citizens[tutor_id].name;
				
				const mrz_field = visaFields['mrz_2'];
				
				const mrz_text_id = unescapeHtml(mrz_field.innerHTML);
				const escaped_id = escapeMrz(tutor_id.toString());
				const replacement_id = escaped_id.substring(0,1).padEnd(1,'<');
				const linked_id_str = mrz_text_id.substring(1,9);
				mrz_field.innerHTML = escapeHtml(replacement_id+linked_id_str+checksum(replacement_id+linked_id_str)+mrz_text_id.substring(10));
				
				const mrz_text_initials = unescapeHtml(mrz_field.innerHTML);
				const escaped_initials = escapeMrz(citizens[tutor_id].initials);
				const replacement_initials = escaped_initials.substring(0,2).padEnd(2,'<');
				const linked_initials_str = mrz_text_initials.substring(30,31);
				mrz_field.innerHTML = escapeHtml(mrz_text_initials.substring(0,28)+replacement_initials+linked_initials_str+checksum(replacement_initials+linked_initials_str)+mrz_text_initials.substring(32));
			}
		}
	}
	
	function onVisaNumberInput(){
		return function(input){
			return function(e){
				const num_str = input.value.toString().padStart(3,'0');
				visaFields["visa_number"].innerHTML = escapeMrz(visaFields["visa_number"].innerHTML).substring(0,1) + num_str;
				
				const mrz_field = visaFields['mrz_2'];
				const mrz_text = unescapeHtml(mrz_field.innerHTML);
				const escaped_str = escapeMrz(num_str);
				const replacement_str = escaped_str.substring(0,3).padEnd(3,'<');
				const temp_mrz_text = mrz_text.substring(0,1)+replacement_str+mrz_text.substring(4)
				mrz_field.innerHTML = escapeHtml(temp_mrz_text.substring(0,9)+checksum(temp_mrz_text.substring(0,9))+temp_mrz_text.substring(10));
			}
		}
	}
	
	function onPhotoUpload(){
		return function(input){
			return function(e){
				if(visaPhoto){
					visaPhoto.remove();
				}
				
				const photo = input.files[0];
				const svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
				const img_url = URL.createObjectURL(event.target.files[0]);
				
				
				const img = document.createElement("img");
				img.onload = function() {
					let base64 = getBase64Image(img);
					svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', base64);
					//svg = svg.replace(url,base64);
					img.remove();
				}
				img.src = img_url;
				
				svgimg.setAttributeNS(null,'height',visaPhotoArea.getAttribute('height'));
				svgimg.setAttributeNS(null,'width',visaPhotoArea.getAttribute('width'));
				svgimg.setAttributeNS(null,'x',visaPhotoArea.getAttribute('x'));
				svgimg.setAttributeNS(null,'y',visaPhotoArea.getAttribute('y'));
				svgimg.setAttributeNS(null, 'visibility', 'visible');
				visaPhoto = svgimg;
				visaPhotoArea.parentElement.appendChild(svgimg);
				
			}
		}
	}
	
	const identity_fieldset = document.createElement("fieldset");
	inputsContainer.appendChild(identity_fieldset);
	const identity_legend = document.createElement("legend");
	identity_legend.appendChild(document.createTextNode("Identité"));
	identity_fieldset.appendChild(identity_legend);
	
	const modalities_fieldset = document.createElement("fieldset");
	inputsContainer.appendChild(modalities_fieldset);
	const modalities_legend = document.createElement("legend");
	modalities_legend.appendChild(document.createTextNode("Modalités"));
	modalities_fieldset.appendChild(modalities_legend);
	
	const admin_fieldset = document.createElement("fieldset");
	inputsContainer.appendChild(admin_fieldset);
	const admin_legend = document.createElement("legend");
	admin_legend.appendChild(document.createTextNode("Procédure"));
	admin_fieldset.appendChild(admin_legend);
	
	
	inputs["name"]=getTextInput("Nom",visaFields["name"].innerHTML, onTextInputChange('name',1,5,39,'first_name'), "name_input");
	identity_fieldset.appendChild(inputs["name"].label);
	
	inputs['first_name']=getTextInput("Prénom",visaFields["first_name"].innerHTML, onTextInputChange('first_name',1,5,39,'name',true), "first_name_input");
	identity_fieldset.appendChild(inputs['first_name'].label);
	
	inputs["avatar"]=getTextInput("Avatar",visaFields["avatar"].innerHTML, onTextInputChange('avatar',2,32,12), "avatar_input");
	identity_fieldset.appendChild(inputs["avatar"].label);
	
	inputs["delivery_place"]=getTextInput("Lieu de délivrance",visaFields["delivery_place"].innerHTML, onTextInputChange('delivery_place'), "delivery_place_input");
	admin_fieldset.appendChild(inputs["delivery_place"].label);
	
	inputs["nationality"]=getTextInput("Nationalité",visaFields["nationality"].innerHTML, onTextInputChange('nationality',2,10,3), "nationality_input",3);
	identity_fieldset.appendChild(inputs["nationality"].label);
	
	inputs["birth_date"]=getDateInput("Date de naissance",visaFields["birth_date"].innerHTML, onDateInputChange('birth_date',2,13),"birth_date_input");
	identity_fieldset.appendChild(inputs["birth_date"].label);
	
	inputs["delivery_date"]=getDateInput("Date de délivrance",visaFields["delivery_date"].innerHTML, onDateInputChange('delivery_date'),"delivery_date_input");
	admin_fieldset.appendChild(inputs["delivery_date"].label);
	
	inputs["start_date"]=getDateInput("Date de début",visaFields["start_date"].innerHTML, onDateInputChange('start_date'),"start_date_input");
	modalities_fieldset.appendChild(inputs["start_date"].label);
	
	inputs["end_date"]=getDateInput("Date de fin",visaFields["end_date"].innerHTML, onDateInputChange('end_date',2,21),"end_date_input");
	modalities_fieldset.appendChild(inputs["end_date"].label);
	
	inputs["gender"]=getRadio("Sexe","gender",["M","F","A"],["M","F","A"],visaFields["gender"].innerHTML,onRadioInputChange('gender',2,20,1));
	identity_fieldset.appendChild(inputs["gender"].label);
	
	inputs["entries"]=getRadio("Entrées","entries",["1","2","MULT"],["1","2","MULT"],visaFields["entries"].innerHTML,onRadioInputChange('entries',2,30,1,-2));
	modalities_fieldset.appendChild(inputs["entries"].label);
	
	inputs["tutor"]=getRadio("Tuteur","tutor",Array.from(citizens,(t)=>t.name),Array.from(citizens,(t)=>t.id),visaFields["visa_number"].innerHTML.substring(0,1),onTutorInputChange());
	modalities_fieldset.appendChild(inputs["tutor"].label);
	
	inputs["visa_num"]=getIntInput("Numéro de visa",visaFields["visa_number"].innerHTML.substring(1), onVisaNumberInput(),"visa_number_input");
	admin_fieldset.appendChild(inputs["visa_num"].label);
	
	console.log()
	
	inputs["photo"]=getPhotoInput("Photo", onPhotoUpload('photo'), "photo_input");
	identity_fieldset.appendChild(inputs["photo"].label);
	
	
	function save_svg(){
		
		fetch('style.css')
		.then(response => response.text())
		.then(text => {
			const svg = visaContainer.innerHTML;
			var blob = new Blob([svg], {type: "image/svg+xml"});  
			saveFile(blob, "visa.svg");
		})
	}
	
	const saveButton = document.createElement("button");
	saveButton.innerHTML = "Enregistrer";
	saveButton.addEventListener("click", save_svg);
	inputsContainer.appendChild(saveButton);
});
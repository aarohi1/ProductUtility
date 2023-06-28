import { LightningElement, api, track } from 'lwc';
export default class CustomTable extends LightningElement {
    @api tHead;
    @track fieldList = [];
    connectedCallback() {
        let fields = [];
        this.tHead = JSON.parse(JSON.stringify(this.tHead));
        console.log('this.tHead==>',this.tHead);
        for (var key in this.tHead.Product) {
            console.log('this.tHead.Product[key].split(',')[0]====>',this.tHead.Product[key].split(',')[0]);
           // if (key == 'Product') {
                fields.push({
                    label: this.tHead.Product[key].split(',')[0],
                    value: key,
                    type: this.tHead.Product[key].split(',')[1],
                });
            //}
        }
        console.log('fields==>',fields);
        fields.forEach(element => {
            let field = {
                label: element.label,
                value: element.value,
                isText: (element.type == 'DATE' || element.type == 'DATETIME' || element.type == 'PICKLIST' || element.type == 'DOUBLE' || element.type == 'CURRENCY') ? false : true,
                isDate: element.type == 'DATE' ? true : false,
                isDateTime: element.type == 'DATETIME' ? true : false,
                isPicklist: element.type == 'PICKLIST' ? true : false,
                isDouble: element.type == 'DOUBLE' || element.type == 'CURRENCY' ? true : false,
                picklistValues: [],
                needOperator: true
            }
            if (field.isDate || field.isDateTime) {
                field.needOperator = false;
            }
            this.fieldList.push(field);           
        })
        console.log('fieldList==>',this.fieldList);
    }
}
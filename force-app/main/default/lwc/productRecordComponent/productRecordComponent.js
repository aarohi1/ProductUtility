import { LightningElement,api,track } from 'lwc';
export default class ProductRecordComponent extends LightningElement {
    @api childData;

    @track productRelatedData = [];

    connectedCallback() {
        // console.log('PRODUCT child Data===',JSON.stringify(this.childData));
        this.handleData();
    }

    handleData(){
        var detailRecObj = {tHead: [], tRec: [] };
        var detailRecHead = [];
        var detailRecdata = [];
        for(var key in this.childData[0]){
            // console.log('i==',JSON.stringify(this.childData[0][key]));
            detailRecdata.push(this.childData[0][key]);
            detailRecdata.push({Pricebook2:this.childData[0][key].Pricebook2.Name});
        }
        detailRecObj.tRec = detailRecdata;
            for(var key in detailRecdata[0]){
                detailRecHead.push(key);
                if(key=='ProductCode'){
                    detailRecObj.tHead.push({ label: 'Product Code', fieldName: key });
                }
                if(key=='UnitPrice'){
                    detailRecObj.tHead.push({ label: 'List Price', fieldName: key });
                }
            
                if(key=='Pricebook2'){
                    detailRecObj.tHead.push({ label: 'Price Book Entry', fieldName: 'Pricebook2'});
                }
                
            }
        // console.log('detailRecObj===>',JSON.stringify(detailRecObj));
        this.productRelatedData.push(detailRecObj);
    }


    onClose() {
        this.dispatchEvent(new CustomEvent('closedetailpage', {}));
    }

}
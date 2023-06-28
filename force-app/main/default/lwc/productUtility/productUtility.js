import { LightningElement, track, api } from 'lwc';
import getFieldsAndRecords from '@salesforce/apex/ProductUtility.getFieldValues';
export default class ProductUtility extends LightningElement {
    @track listRecord;
    @track hasValue=false;
    @track fieldMap;
    @track listPriceCPQ=[];
    connectedCallback() {
        getFieldsAndRecords()
            .then(data => {
                console.log('data length==>', data);

                if(this.data!==null){
                    this.listRecord = data;
                    console.log('data-->', data);
                    this.fieldMap = data.fieldMap;
                    this.hasValue = true;
                    this.handleData();
                }
            })
    }
    handleData() {
        var productList = [];
        var i = 1;
        let mapval = [];
        console.log('this.listRecord Val===>', this.listRecord.recordList);
        for (var key in this.listRecord.recordList) {
            console.log('this.listRecord.recordList[key]===>', this.listRecord.recordList[key].Product[0]);
            this.listRecord.recordList[key].Product[0].rowNumber = i;
           // console.log('this.listRecord.recordList[key].Product[0]==>', this.listRecord.recordList[key].Product[0]);
            productList.push(this.listRecord.recordList[key].Product[0]);
            // this.listPriceCPQ.push({
            //     Id: this.listRecord.recordList[key].Product[0].Id,
            //     listPrice: this.listRecord.recordList[key].Product[0].List_Price_CPQ__c,
            // })
            i++;
            // for (var discountKey in this.listRecord.recordList[key]['Discount Schedule']) {
            //     mapval.push({
            //         label: this.listRecord.recordList[key]['Discount Schedule'][discountKey].Id, value: this.listRecord.recordList[key]['Discount Schedule'][discountKey]
            //     });
            // }
        }
        this.listOfRecords = productList;

         console.log('productList Val===>', productList);
        console.log('Map Val===>', mapval);
         console.log('List Price--->',listPriceCPQ);
    }
}
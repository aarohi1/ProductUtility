import { LightningElement, track, wire } from 'lwc';
import getData from '@salesforce/apex/ProductLWCController.getData';
import getFilteredData from '@salesforce/apex/ProductLWCController.getFilteredData';
import getAllObjFiedlMap from '@salesforce/apex/ProductLWCController.getAllObjFiedlMap';
import revertDisabled from '@salesforce/apex/ProductLWCController.revertDisabled';
import updateProduct from '@salesforce/apex/ProductLWCController.updateProduct';
import revertProduct from '@salesforce/apex/ProductLWCController.revertProduct';
import { loadStyle } from 'lightning/platformResourceLoader';
import LightningCardCSS from '@salesforce/resourceUrl/datatableCSS';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductUtilityCmp extends LightningElement {
    
    @track isLoading = true;
    @track isDetailShow = false;
    @track originalData = [];
    @track filteredData = [];
    @track tableData = [];
    @track allFieldMap = [];
    @track fieldDependencyList = [];

    //Pagination
    @track currentPage = 1;
    @track totalPages = 0;
    @track recordStart = 1;
    @track recordEnd = 10;
    @track pageSize = 10;
    @track totalRecords = 0;

    @track pageNumber = [];
    @track tHeadList;

    @track filterOpen = false;
    @track filterPriceookId = 'all';


    //datatable
    @track dataTableColumns = [];

    //related record
    @track relatedPricebookData;

    //update
    @track isFieldDepCheck = false;
    @track percentRate = 0;
    @track operatorVal = '+';
    @track selectedProductRecID = [];

    //revert
    @track isRevertdisabled = true;

   
    //Load data
    getProductData(){
        getData({})
        .then(result => {
            this.originalData = result;
            this.filteredData = result;
            this.getField();
        })        
    }

    getField(){
        getAllObjFiedlMap({})
        .then(result => { 
            this.allFieldMap = result;
            this.processTableBuild();
        })   
    }

    connectedCallback(){
        this.getProductData();
        this.revertedDisabled();
    }
    

    /**
     * getters
     */
    get pageSizeOptions() {
        return [
            { label: '10', value: '10' },
            { label: '30', value: '30' },
            { label: '60', value: '60' },
            { label: '100', value: '100' }
        ];
    }

    get getOperator() {
        return [
            { label: '+', value: '+' },
            { label: '-', value: '-' }
        ];
    }

    get bDisableFirst() {
        return this.recordStart === 1;
    }

    get bDisableLast() {
        return this.recordEnd === this.totalRecords;
    }

    get bDvalButton(){
        if(this.isFieldDepCheck){
            return false;
        }else{
            return true;
        }
    }

    getDataTableColumns(){  
        let fields = [];
        var i = 0;
        fields.push({ label: '', fieldName: 'rowNumber', type: 'number', fixedWidth: 40 });
        for (var key in this.allFieldMap.Product) {
            if (i == 0) {
                fields = [...fields, {
                    label: this.allFieldMap.Product[key].split(',')[0],
                    fieldName: 'URLField',
                    editable: false,
                    showRowNumberColumn: false,
                    type: 'url',
                    typeAttributes: {
                        label: {
                            fieldName: key
                        },
                        tooltip: {
                            fieldName: key
                        },

                        target: '_blank'
                    },
                    sortable: true
                }];
            }
            else {
                if (key == 'List_Price_CPQ__c') {
                    fields = [...fields, {
                        label: this.allFieldMap.Product[key].split(',')[0],
                        fieldName: key,
                        editable: true,
                        showRowNumberColumn: false,
                        type: 'number'
                    }];
                }
                else {
                    fields = [...fields, {
                        label: this.allFieldMap.Product[key].split(',')[0],
                        fieldName: key,
                        editable: true,
                        showRowNumberColumn: false,
                        type: 'text'
                    }];
                }
            }
            i++;
        }
        fields.push({
            label: 'Related', fieldName: 'Related', type: 'button', title: 'relatedObject',
            typeAttributes: {
                label: {
                    fieldName: 'Related'
                },
                variant: 'base',
                target: 'relatedObject'
            },
        });
        return fields;
    }

    /**
     * Functional function
     */

    countTablePageCounts() {
        this.totalRecords = this.filteredData.length;
        this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageSize)));
    }

    revertedDisabled(){
        revertDisabled({})
        .then(result=>{
            this.isRevertdisabled = result;
        });
    }

    processTableBuild(){ 
        this.isLoading = true;
        this.countTablePageCounts();
        this.dataTableColumns = this.getDataTableColumns();
        this.processFieldDependencyValues();    
        this.isLoading = false;   
        this.paginationHelper();
        this.handlePageList();
        this.isLoading = false;
    }
    
    processFieldDependencyValues() {
        let fieldDepList = [];
        this.fieldDependencyList = [];
        for (var key in this.allFieldMap) {
            if (key != 'Product' && key != 'Discount Schedule') {
                fieldDepList.push(key);
            }
        }    
        for (var j in fieldDepList) {
            if (fieldDepList[j] == 'Pricebook Entry') {
                this.fieldDependencyList.push('List Price');
            }
        }
    }

    paginationHelper(){
        this.tableData = [];

        for (let i = (this.recordStart) - 1; i < this.recordEnd &&  i < this.filteredData.length; i++) {
            let rec = JSON.parse(JSON.stringify(this.filteredData[i].prod)); 
            
            let URLField = '/lightning/r/' + 'Product2' + '/' + rec.Id + '/view';
            let Related = 'Related';
            let rowNumber = i + 1;
            rec = { ...rec, URLField, Related, rowNumber };
            this.tableData.push(rec);
        }
    }

    async handleSave(event){
        this.isLoading = true;
        // Convert datatable draft values into record objects
        const records = event.detail.draftValues.slice().map((draftValue) => {
            const fields = Object.assign({}, draftValue);
            return { fields };
        });

        
        // Clear all datatable draft values
        this.draftValues = [];

        try {

            // Update all records in parallel thanks to the UI API
            const recordUpdatePromises = records.map((record) =>
                updateRecord(record)
            );
            await Promise.all(recordUpdatePromises);

            this.isLoading = false;
            this.revertedDisabled();
            this.refreshData();
         
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading product',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        }
    }

    refreshData(){
        if(this.filterPriceookId == null || this.filterPriceookId == undefined || this.filterPriceookId == '' ){
            this.getProductData();
        } else {
            this.handleFilterData();
        }

        if(this.searchKey == null || this.searchKey == '' || this.searchKey == undefined){
            this.handleSearchData();
        }

        this.paginationHelper();
    }

    handleRelatedClick(event){
        var productId = event.detail.row.Id;
        this.isDetailShow = true;
        var childProductData = this.originalData.filter(function(item) {
            if(item.prod.Id==productId){
                return item.prod;
            } else {
                return false ;
            }              
        })
        this.relatedPricebookData = childProductData.map(item=>{
            return item.prod.PricebookEntries;
        })
    }
    handleCloseDetailPage(){
        this.isDetailShow = false;
    }

    /**
     * Search input
     */

    onchangeSearch (event) {
         this.searchKey = event.target.value.toLowerCase();
    }

    handleSearchonKeyPress(event){
        try {
            this.searchKey = event.target.value.toLowerCase();

            if (event.keyCode === 13) {
               this.handleSearchData();
            }
        } catch (error) {
            console.log(error);
            console.log(error.stack);
        }    
    }
    handleSearchData(){
        this.isLoading = true;
        let searchString = this.searchKey ;
        this.filteredData = this.originalData.filter( function(item) {
            if(item.prod.ProductCode){
                let temp = item.prod.ProductCode.toLowerCase();
                return -1 === temp.search(searchString) ? false : true;
            } else {
                return false ;
            }                    
        });
        this.isLoading = false;
        this.countTablePageCounts();
        this.handlePageList();
        this.paginationHelper();
        this.handleOnClickFirstPage();
    }

    /**
     * Filter
     */

    handleFilter() {
        this.filterOpen = !this.filterOpen;
    }

    handelFilterValue(event) {
        this.filterPriceookId = event.detail;
        this.handleFilterData();
    }    

    handleFilterData(){
        this.isLoading = true;
        getFilteredData({pricebookId : this.filterPriceookId})
        .then(result => {
            this.originalData = result;
            this.filteredData = result;
            this.tableData = JSON.parse(JSON.stringify(result));     
            this.isLoading = false; 
            this.processTableBuild(); 
            this.handleOnClickFirstPage();    
        })
    }

    /**
     * Pagination
     */

    handlePageList() {
        this.pageNumber = [];
        var j = Math.ceil(Number(this.currentPage) / 7);
        if (7 * j <= Number(this.totalPages)) {
            for (var i = (7 * j) - 6; i <= (7 * j); i++) {
                if (i == this.currentPage) {
                    this.pageNumber.push({
                        class: 'pageNumberSelectedClass',
                        value: i
                    });
                }
                else {
                    this.pageNumber.push({
                        class: 'pageNumberClass',
                        value: i
                    });
                }
            }
        } else {
            for (var i = (7 * j) - 6; i <= (Number(this.totalPages)); i++) {
                if (i == this.currentPage) {
                    this.pageNumber.push({
                        class: 'pageNumberSelectedClass',
                        value: i
                    });
                }
                else {
                    this.pageNumber.push({
                        class: 'pageNumberClass',
                        value: i
                    });
                }
            }
        }
    }

    handleOnClickFirstPage() {
        this.currentPage = 1;
        this.recordStart = 1;
        this.recordEnd = this.pageSize;
        this.handlePageList();
        this.paginationHelper();
    }
    
    handleOnClickPrevPage() {
        this.currentPage = this.currentPage - 1;
        if ((Number(this.recordStart) - Number(this.pageSize) >= 1)) {
            this.recordEnd = Number(this.recordStart) - 1;
            this.recordStart = Number(this.recordStart) - Number(this.pageSize);
        }
        else {
            this.recordEnd = Number(this.recordEnd) - Number(this.pageSize);
            this.recordStart = 1;
        }
        this.handlePageList();
        this.paginationHelper();
    }

    handleOnClickNextPage() {
        this.currentPage = this.currentPage + 1;
        if ((Number(this.recordEnd) + Number(this.pageSize) <= this.totalRecords)) {
            this.recordStart = Number(this.recordStart) + Number(this.pageSize);
            this.recordEnd = Number(this.recordEnd) + Number(this.pageSize);
        }
        else {
            this.recordStart = Number(this.recordStart) + Number(this.pageSize);
            this.recordEnd = this.totalRecords;
        }
        this.handlePageList();
        this.paginationHelper();
    }

    handleOnClickLastPage() {
        this.currentPage = this.totalPages;
        if ((Number(this.totalRecords) % Number(this.pageSize)) == 0) {
            this.recordStart = ((Math.floor(Number(this.totalRecords) / Number(this.pageSize))) - 1) * this.pageSize + 1;
        }
        else {
            this.recordStart = (Math.floor(Number(this.totalRecords) / Number(this.pageSize))) * this.pageSize + 1;
        }
        this.recordEnd = this.totalRecords;
        this.handlePageList();
        this.paginationHelper();
    }

    handleOnClickRandomPage(event) {
        this.currentPage = event.detail.pagevalue;
        if (Number(this.currentPage) < Number(this.totalPages)) {
            this.handlePageList();
            this.recordStart = (Number(this.currentPage) - 1) * Number(this.pageSize) + 1;
            this.recordEnd = (Number(this.currentPage)) * Number(this.pageSize);
        }
        else {
            this.handleOnClickLastPage();
        }
        this.paginationHelper();
    }

    handlePageSizeChange(event) {
        this.currentPage = 1;
        this.recordStart = 1;
        this.pageSize = event.detail.pagevalue;
        this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageSize)));
        this.handlePageList();
        if (this.pageSize <= this.totalRecords) {
            this.recordEnd = event.detail.pagevalue;
        }
        else {
            this.recordEnd = this.totalRecords;
        }
        this.paginationHelper();
    }

     /**
     * Update Functionality
     */

    onFieldDependencySelect(event){
        this.isFieldDepCheck = event.target.checked;
    }

    handlePercenChange(event){
        if(event.target.value>0){
            this.percentRate = event.target.value;
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'ERROR',
                    message: 'Negative value not allowed',
                    variant: 'Error'
                })
            );
        }
    }
    handleOperatorChange(event){
        this.operatorVal = event.target.value;
    }

    handleRowSelection(event){
        let productRec = event.detail.selectedRows;
        this.selectedProductRecID = productRec.map(item=>{
            return item.Id;
        });
    }

    async onUpdateProduct(){
        console.log('percent Rate====>',this.percentRate);
        console.log('operatorVal====>',this.operatorVal);
        if(this.percentRate < 0 || this.percentRate == 0 || this.operatorVal == ''){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ' Cannot Perform Update Operation ',
                    message: 'Check Percent Rate or Operator value',
                    variant: 'Error'
                })
            );
        }else{
            if(this.selectedProductRecID.length == 0){
                let allProdId = this.originalData.map(item=>{
                    return item.prod.Id;
                })
                this.selectedProductRecID = allProdId;
            }
            this.isLoading = true;
            await updateProduct({filterPriceBookId:this.filterPriceookId, rate:this.percentRate, operatorValue:this.operatorVal, selectedProdId:this.selectedProductRecID})
            .then(result=>{
                this.selectedProductRecID = [];
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Price Updated Successfully ',
                        message: result,
                        variant: 'success'
                    })
                );
                this.revertedDisabled();
                this.refreshData();
                this.isLoading = false;
            })
        }
    }



    handleRevert(){
        revertProduct({})
        .then(result=>{
            this.operatorVal = '';
            this.selectedProductRecID = [];
            this.percentRate = '%';
            if(result=='Success'){
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Price Reverted Successfully ',
                        message: result,
                        variant: 'success'
                    })
                );
            }else if(result == 'Already Reverted'){
                this.revertedDisabled();
            }
            else{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Price Not Reverted',
                        message: result,
                        variant: 'Error'
                    })
                );
            }
            this.revertedDisabled();
            this.refreshData();
            this.isLoading = false;
        })
    }

    /**
     * Helper function
     */

    renderedCallback() {
        //css to hide first column in datatable
        Promise.all([
            loadStyle(this, LightningCardCSS)
        ]).then(() => {}).catch(error => {
            console.log(error.body.message);
        });
    }

}
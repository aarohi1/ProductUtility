import { LightningElement, track, wire } from 'lwc';
import getData from '@salesforce/apex/ProductLWCController.getData';
import getFilteredData from '@salesforce/apex/ProductLWCController.getFilteredData';
import getAllObjFiedlMap from '@salesforce/apex/ProductLWCController.getAllObjFiedlMap';
import updateProduct from '@salesforce/apex/ProductLWCController.updateProduct';
import { loadStyle } from 'lightning/platformResourceLoader';
import LightningCardCSS from '@salesforce/resourceUrl/datatableCSS';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductUtilityCmp extends LightningElement {
    
    @track isLoading = true;
    @track originalData = [];
    @track filteredData = [];
    @track tableData = [];
    @track allFieldMap = [];
    @track fieldDependencyList = [];
    @track wireProductList=[];

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
    @track filterPriceookId = '';


    //datatable
    @track dataTableColumns = [];

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
        this.fieldDependencyList = [];
        for (var key in this.allFieldMap) {
            if (key != 'Product' && key != 'Discount Schedule') {
                this.fieldDependencyList.push(key);
            }
        }    
        for (var j in this.fieldDependencyList) {
            if (this.fieldDependencyList[j] == 'Discount Tier') {
                this.fieldDependencyList[j] = 'Volume Price';
            }
            if (this.fieldDependencyList[j] == 'Pricebook Entry') {
                this.fieldDependencyList[j] = 'List Price';
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
        var childProductData = this.originalData.filter(function(item) {
            if(item.prod.Id==productId){
                let temp = item.prod;
                return temp;
            } else {
                return false ;
            }              
        })
        console.log('Child Data--->', JSON.stringify(childProductData));
        var relatedPricebook = childProductData.map(item=>{
            return item.prod.PricebookEntries;
        })
        console.log('related data==>',JSON.stringify(relatedPricebook));
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
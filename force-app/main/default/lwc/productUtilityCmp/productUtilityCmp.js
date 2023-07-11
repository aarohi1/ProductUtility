import { LightningElement, track, wire } from 'lwc';
import getData from '@salesforce/apex/ProductLWCController.getData';
import getFilteredData from '@salesforce/apex/ProductLWCController.getFilteredData';
import getAllObjFiedlMap from '@salesforce/apex/ProductLWCController.getAllObjFiedlMap';
import { loadStyle } from 'lightning/platformResourceLoader';
import LightningCardCSS from '@salesforce/resourceUrl/datatableCSS';

export default class ProductUtilityCmp extends LightningElement {
    
    @track isLoading = true;
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
    //@track totalPages = 0 ;

    @track pageNumber = [];
    @track tHeadList;

    @track filterOpen = false;
    @track filterPriceookId = '';


    //datatable
    @track dataTableColumns = [];

    //Load data
    connectedCallback() {
        getData({})
        .then(result => {
            console.log(result);
            this.originalData = result;
            this.filteredData = result;
            this.tableData = JSON.parse(JSON.stringify(result));           
        })

        getAllObjFiedlMap({})
        .then(result => {
            console.log(result);
            this.allFieldMap = result;
            this.processTableBuild();
        })   
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
        try {      
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
        } catch (error) {
            console.log(error);
            console.log(error.stack);
        }    
    }

    /**
     * Functional function
     */

    countTablePageCounts() {
        this.totalRecords = this.filteredData.length;
        this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageSize)));
    }

    processTableBuild(){ 
        try {
            this.isLoading = true;
            this.countTablePageCounts();
            this.dataTableColumns = this.getDataTableColumns();
            this.processFieldDependencyValues();    
            this.isLoading = false;   
            this.paginationHelper();
            this.handlePageList();
            this.isLoading = false;
        } catch (error) {
            console.log(error);
            console.log(error.stack);
        }    
    }
    
    processFieldDependencyValues() {
        try {
            this.fieldDependencyList = [];
            for (var key in this.allFieldMap) {
                console.log('KEY==>', key);
                if (key != 'Product' && key != 'Discount Schedule') {
                    this.fieldDependencyList.push(key);
                }
            }
            console.log(JSON.stringify(this.fieldDependencyList));           
            for (var j in this.fieldDependencyList) {
                if (this.fieldDependencyList[j] == 'Discount Tier') {
                    this.fieldDependencyList[j] = 'Volume Price';
                }
                if (this.fieldDependencyList[j] == 'Pricebook Entry') {
                    this.fieldDependencyList[j] = 'List Price';
                }
            }
            console.log(JSON.stringify(this.fieldDependencyList));
        } catch (error) {
            console.log(error);
            console.log(error.stack);
        }    
    }

    paginationHelper(){
        this.tableData = [];

        for (let i = (this.recordStart) - 1; i < this.recordEnd; i++) {
            let rec = JSON.parse(JSON.stringify(this.filteredData[i].prod)); 
            
            let URLField = '/lightning/r/' + 'Product2' + '/' + rec.Id + '/view';
            let Related = 'Related';
            let rowNumber = i + 1;
            rec = { ...rec, URLField, Related, rowNumber };
            console.log(JSON.stringify(rec));
            this.tableData.push(rec);
        }
    }


    /**
     * Search input
     */
    onchangeSearch (event) {
         this.searchKey = event.target.value.toLowerCase();
    }

    handleSearchonKeyPress(event){
        try {
            console.log(event.target.value);
            this.searchKey = event.target.value.toLowerCase();
            console.log(this.searchKey);
            console.log('event.keyCode==', event.keyCode);

            if (event.keyCode === 13) {
                this.isLoading = true;

                let searchString = this.searchKey ;
                this.filteredData = this.originalData.filter( function(item) {
                    console.log(JSON.stringify(item));
                    console.log(item.prod.ProductCode);
                    if(item.prod.ProductCode){
                        let temp = item.prod.ProductCode.toLowerCase();
                        console.log('temlo', temp);
                        console.log('temlo', temp.search(searchString));
                        return -1 === temp.search(searchString) ? false : true;
                    } else {
                        return false ;
                    }                    
                });
                console.log('finished');
                console.log(this.tableData.length);
                console.log(this.tableData);
                this.isLoading = false;
                this.countTablePageCounts();
                this.handlePageList();
                this.paginationHelper();
                this.handleOnClickFirstPage();
            }
        } catch (error) {
            console.log(error);
            console.log(error.stack);
        }    
    }

    /**
     * Filter
     */
    handleFilter() {
        this.filterOpen = !this.filterOpen;
    }

    handelFilterValue(event) {
        this.filterPriceookId = event.detail;
        console.log(this.filterPriceookId);
        this.isLoading = true;
        getFilteredData({pricebookId : this.filterPriceookId})
        .then(result => {
            console.log(result);
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
        ]).then(() => {
            console.log('Files loaded');
        }).catch(error => {
            console.log(error.body.message);
        });
    }

}
import { LightningElement, track, api } from 'lwc';
import getFieldsAndRecords from '@salesforce/apex/ProductUtility.getFieldValues';
export default class ProductUtility extends LightningElement {
    @track listRecord;
    @track hasValue = false;
    @track closeCheck = false;
    @track detailPage = false;
    @track tHead;
    @track listPriceCPQ = [];
    @track recordEnd = 10;
    @track recordStart = 1;
    @track currentPage = 1;
    @track pageSize = 10;
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = [];
    @track tempTHeadList;
    @track tHeadList;
    @track tableData;
    connectedCallback() {
        getFieldsAndRecords()
            .then(data => {
                console.log('data length==>', data);
                console.log('connectedcallback currentPage-->',this.currentPage);
                if (this.data !== null) {
                    this.listRecord = data;
                    console.log('data-->', data);
                    this.tHead = data.fieldMap;
                    this.hasValue = true;
                    this.handleData();
                }
            })
    }
    get pageSizeOptions() {
        return [
            { label: '10', value: '10' },
            { label: '30', value: '30' },
            { label: '60', value: '60' },
            { label: '100', value: '100' }
        ];
    }
    handleData() {
        var productList = [];
        var i = 1;
        for (var key in this.listRecord.recordList) {
            this.listRecord.recordList[key].Product[0].rowNumber = i;
            productList.push(this.listRecord.recordList[key].Product[0]);
            this.listPriceCPQ.push({
                Id: this.listRecord.recordList[key].Product[0].Id,
                listPrice: this.listRecord.recordList[key].Product[0].List_Price_CPQ__c,
            })
            i++;
        }
        this.totalRecords = i - 1;
        this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageSize)));
        this.listOfRecords = productList;
        this.recordEnd = 10;
        this.recordStart = 1;
        this.setTableHead();
        this.setTableData();
        this.handlePageList();
    }
    setTableHead() {
        let fields = [];
        var i = 0;
         fields.push({ label: '', fieldName: 'rowNumber', type: 'number', fixedWidth: 40 });
        for (var key in this.tHead.Product) {
            if (i == 0) {
                fields = [...fields,
                {
                    label: this.tHead.Product[key].split(',')[0],
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
                        label: this.tHead.Product[key].split(',')[0],
                        fieldName: key,
                        editable: true,
                        showRowNumberColumn: false,
                        type: 'number'
                    }];
                }
                else {
                    fields = [...fields, {
                        label: this.tHead.Product[key].split(',')[0],
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
        this.tHeadList = fields;
    }
    setTableData() {
        let records = [];
        let URLField;
        let Related;
        for (let i = (this.recordStart) - 1; i < this.recordEnd; i++) {
            records.push(this.listOfRecords[i]);
        }
        
        this.tableData = records;
        this.tableData = records.map(item => {
            URLField = '/lightning/r/' + 'Product2' + '/' + item.Id + '/view';
            Related = 'Related';
            item = { ...item, URLField, Related };
            return { ...item, Related };
        });
    }
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
        }

        else {
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
    handleOnClickFirstPage(event){
        console.log('handleOnClickFirstPage');
        // this.closeCheck = true;
        // this.handleback();
        this.currentPage = 1;
        this.recordStart = 1;
        this.recordEnd = this.pageSize;
        this.handlePageList();
        this.setTableData();
    }
     handleOnClickPrevPage(event){
        console.log('handleOnClickPrevPage');
        //  this.closeCheck = true;
        // this.handleback();
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
        this.setTableData();
    }
    handleOnClickNextPage(){
        console.log('handleOnClickNextPage');
        // this.closeCheck = true;
        // this.handleback();
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
        this.setTableData();
    }
    handleOnClickLastPage(event){
        this.closeCheck = true;
        this.handleback();
        this.currentPage = this.totalPages;
        if ((Number(this.totalRecords) % Number(this.pageSize)) == 0) {
            this.recordStart = ((Math.floor(Number(this.totalRecords) / Number(this.pageSize))) - 1) * this.pageSize + 1;
        }
        else {
            this.recordStart = (Math.floor(Number(this.totalRecords) / Number(this.pageSize))) * this.pageSize + 1;
        }
        this.recordEnd = this.totalRecords;
        this.handlePageList();
        this.setTableData();
    }
     handleOnClickRandomPage(event){
        this.closeCheck = true;
        this.handleback();
        this.currentPage = event.detail.pagevalue;
        if (Number(this.currentPage) < Number(this.totalPages)) {
            this.handlePageList();
            this.recordStart = (Number(this.currentPage) - 1) * Number(this.pageSize) + 1;
            this.recordEnd = (Number(this.currentPage)) * Number(this.pageSize);
        }
        else {
            this.handleOnClickLastPage();
        }
        this.setTableData();

    }
    handleback(event) {
        if (this.closeCheck) {
            this.detailPage = false;
        }
        else {
            this.detailPage = !(this.detailPage); 
            this.datatable = true;
        }
    }
    handlePageSizeChange(event){
        console.log('handlePageSizeChange call');
         this.currentPage = 1;
        this.recordStart = 1;
        this.pageSize = event.target.value;
        this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageSize)));
        this.handlePageList();
        if (this.pageSize <= this.totalRecords) {
            this.recordEnd = event.detail.pagevalue;
        }
        else {
            this.recordEnd = this.totalRecords;
        }
        this.setTableData();
    }
     get bDisableFirst() {
        return this.recordStart === 1;
    }
    get bDisableLast() {
        return this.recordEnd === this.totalRecords;
    }

    //  handleChangeInRow(event) {
    //     // this.closeCheck = true;
    //     // this.handleback();
    //     this.currentPage = 1;
    //     this.recordStart = 1;
    //     this.pageNumber = event.target.value;
    //     this.totalPages = (Math.ceil(Number(this.totalRecords) / Number(this.pageNumber)));
    //     this.handlePageList();
    //     if (this.pageNumber <= this.totalRecords) {
    //         this.recordEnd = event.target.value;
    //     }
    //     else {
    //         this.recordEnd = this.totalRecords;
    //     }
    //     this.paginationHelper();
    // }
}
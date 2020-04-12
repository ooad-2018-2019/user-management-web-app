import React from 'react';
import { Table, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getToken } from '../utilities/Common';
import DownloadExcel from './DownloadExcel';

import Highlighter from 'react-highlight-words';


class TableUserLog extends React.Component {
    constructor() {
        super();
        this.state = {
            logs: [],
            filteredInfo: null,
            sortedInfo: null,
            searchText: '',
            searchedColumn: '',
        }
    }

    componentWillMount() {
        this.getLogs();
    }

    timeConverter(timestamp) {
        let a = new Date(timestamp);
        let year = a.getFullYear();
        let month = a.getMonth() + 1;
        let date = a.getDate();
        let hour = a.getHours() < 10 ? '0' + a.getHours() : a.getHours();
        let min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
        let time = date + '.' + month + '.' + year + ' ' + hour + ':' + min;
        return time;
    }

    getLogs() {
        axios.get('https://main-server-si.herokuapp.com/admin/logs', { headers: { Authorization: 'Bearer ' + getToken() } })
            .then(response => {
                let logs = response.data.logs;
                logs.map(log => {
                    log.timestamp = this.timeConverter(log.timestamp);
                    log.name = log.action.name;
                    log.description = log.action.description;
                    log.object = log.action.object;
                    delete log.action;
                    return log;
                });
                this.setState({ logs: logs }, () => {
                    console.log(this.state.logs);
                })
            })
            .catch(err => console.log(err));
    }

    handleChange = (pagination, filters, sorter) => {
        console.log('Various parameters', pagination, filters, sorter);
        this.setState({
            filteredInfo: filters,
            sortedInfo: sorter,
        });
    };

    clearFilters = () => {
        this.setState({ filteredInfo: null });
    };

    clearAll = () => {
        this.setState({
            filteredInfo: null,
            sortedInfo: null,
            searchText: ''
        });
    };

    getColumnSearchProps = dataIndex => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={node => {
                        this.searchInput = node;
                    }}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
                    icon={<SearchOutlined />}
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                >
                    Search
        </Button>
                <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                    Reset
        </Button>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) =>
            record[dataIndex]
                .toString()
                .toLowerCase()
                .includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: visible => {
            if (visible) {
                setTimeout(() => this.searchInput.select());
            }
        },
        render: text =>
            this.state.searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[this.state.searchText]}
                    autoEscape
                    textToHighlight={text.toString()}
                />
            ) : (
                    text
                ),

    });

    handleSearch = (selectedKeys, confirm, dataIndex) => {
        console.log(this.state);
        confirm();
        this.setState({
            searchText: selectedKeys[0],
            searchedColumn: dataIndex,
        });
    };

    handleReset = clearFilters => {
        clearFilters();
        this.setState({ searchText: '' });
    };

    getFiltered = () => {
        let filtered = [];
        for (var key in this.state.filteredInfo) {
            if (this.state.filteredInfo.hasOwnProperty(key) && this.state.filteredInfo[key] != null) {
                filtered.push({
                    key: key,
                    value: this.state.filteredInfo[key][0]
                });
            }
        }

        // filtriranje
        let newLog = this.state.logs.filter((log) => {
            for (let element of filtered) {
                if (log[element.key] !== element.value) {
                    return false;
                }
            }
            return true;
        });

        // sortiranje
        if (this.state.sortedInfo !== null) {
            if (this.state.sortedInfo.order) {
                key = this.state.sortedInfo.columnKey
                let order = this.state.sortedInfo.order === "ascend" ? 1 : -1;
                newLog.sort((log1, log2) => {
                    if (key === "timestamp")
                        return this.customCompareDates(log1[key], log2[key]);
                    return log1[key].localeCompare(log2[key]) * order;
                });
            }
        }
        return newLog;
    }

    customCompareDates = (a, b) => {
        let dateA = a.replace(":", ".").replace(" ", ".").split(".");
        let dateB = b.replace(":", ".").replace(" ", ".").split(".");
        dateA = (new Date(parseInt(dateA[2]), parseInt(dateA[1]), parseInt(dateA[0]), parseInt(dateA[3]), parseInt(dateA[4]))).getTime();
        dateB = (new Date(parseInt(dateB[2]), parseInt(dateB[1]), parseInt(dateB[0]), parseInt(dateB[3]), parseInt(dateB[4]))).getTime();
        if (dateA > dateB)
            return 1;
        if (dateA < dateB)
            return -1;
        return 0;
    }

    render() {
        let sortedInfo = this.state.sortedInfo;
        let filteredInfo = this.state.filteredInfo;
        sortedInfo = sortedInfo || {};
        filteredInfo = filteredInfo || {};
        const columns = [
            {
                title: 'Date',
                dataIndex: 'timestamp',
                key: 'timestamp',
                filteredValue: filteredInfo.userId || null,
                sorter: (a, b) => { return this.customCompareDates(a.timestamp, b.timestamp) },
                sortOrder: sortedInfo.columnKey === 'timestamp' && sortedInfo.order,
                ellipsis: true,
                ...this.getColumnSearchProps('timestamp'),
            },
            {
                title: 'Username',
                dataIndex: 'username',
                key: 'username',
                filteredValue: filteredInfo.username || null,
                sorter: (a, b) => { return a.username.localeCompare(b.username) },
                sortOrder: sortedInfo.columnKey === 'username' && sortedInfo.order,
                ellipsis: true,
                ...this.getColumnSearchProps('username'),
            },
            {
                title: 'Action',
                dataIndex: 'name',
                key: 'name',
                filteredValue: filteredInfo.name || null,
                sorter: (a, b) => { return a.name.localeCompare(b.name) },
                sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
                ellipsis: true,
                ...this.getColumnSearchProps('name'),
            },
            {
                title: 'Object',
                key: 'object',
                dataIndex: 'object',
                filteredValue: filteredInfo.object || null,
                sorter: (a, b) => { return a.object.localeCompare(b.object) },
                sortOrder: sortedInfo.columnKey === 'object' && sortedInfo.order,
                ellipsis: true,
                ...this.getColumnSearchProps('object'),
            },
            {
                title: 'Description',
                key: 'description',
                dataIndex: 'description',
                filteredValue: filteredInfo.description || null,
                sorter: (a, b) => { return a.description.localeCompare(b.description) },
                sortOrder: sortedInfo.columnKey === 'description' && sortedInfo.order,
                ellipsis: true,
                ...this.getColumnSearchProps('description'),
            }
        ];
        return (
            <div>
                <Table columns={columns} dataSource={this.state.logs} onChange={this.handleChange} />
                <div className="table-operations" style={{ marginTop: '-48px' }}>
                    <Button onClick={this.clearAll}>Clear filters and sorters</Button>
                    <DownloadExcel data={this.getFiltered(this.state.logs)} filename="User_log" />
                </div>
            </div>
        );
    }
}

export default TableUserLog;
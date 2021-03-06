import React, { Component } from 'react';
import './App.css';
import FixedTable from './FixedTable';
const head = [
    {
        label: '姓名',
        title: 'name',
    },
    {
        label: '性别',
        title: 'sex',
    },
    {
        label: '职业',
        title: 'job'
    },
]
const body = [
    {name: 'zff', sex: '女', job: 'it'},
    {name: ' lfp', sex: '男', job: 'it'},
    {name: '张三', sex: '男', job: 'it'},
]

class Test extends Component {
    constructor() {
        super();
        this.state = {
            value: ''
        }
    }
    onChange(e) {
        this.setState({
            value: e.target.value
        });
    }
    // handleEvent = evt => {
    //   console.log('----evt', evt);
    // }
    render() {
        return (
            <div className="App">
                {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p> */}
                <div>修改下</div>
                <FixedTable head={head} body={body}/>
                <input type='text' onChange={this.onChange.bind(this)} value={this.state.value}/>
            </div>
        );
    }
}

export default Test;

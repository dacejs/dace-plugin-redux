import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getInitialProps } from '../../../../src';
import { fetchUsers } from './action';
import reducer from './reducer';

@getInitialProps({
  reducer,
  promise: ({ store }) => store.dispatch(fetchUsers())
})
@connect(state => state)
export default class Index extends Component {
  static propTypes = {
    headers: PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <h1>Headers:</h1>
        <p>{ JSON.stringify(this.props.headers) }</p>
      </div>
    );
  }
}

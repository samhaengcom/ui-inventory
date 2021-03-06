import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import Layer from '@folio/stripes-components/lib/Layer';
import Pane from '@folio/stripes-components/lib/Pane';
import PaneMenu from '@folio/stripes-components/lib/PaneMenu';
import { Accordion } from '@folio/stripes-components/lib/Accordion';
import KeyValue from '@folio/stripes-components/lib/KeyValue';
import { Row, Col } from '@folio/stripes-components/lib/LayoutGrid';
import Headline from '@folio/stripes-components/lib/Headline';
import IconButton from '@folio/stripes-components/lib/IconButton';

import transitionToParams from '@folio/stripes-components/util/transitionToParams';
import removeQueryParam from '@folio/stripes-components/util/removeQueryParam';
import craftLayerUrl from '@folio/stripes-components/util/craftLayerUrl';

import ItemForm from './edit/items/ItemForm';

class ViewItem extends React.Component {
  static manifest = Object.freeze({
    items: {
      type: 'okapi',
      path: 'inventory/items/:{itemid}',
    },
    holdingsRecords: {
      type: 'okapi',
      path: 'holdings-storage/holdings/:{holdingsrecordid}',
    },
    instances1: {
      type: 'okapi',
      path: 'instance-storage/instances/:{id}',
    },
    shelfLocations: {
      type: 'okapi',
      records: 'shelflocations',
      path: 'shelf-locations',
    },
    materialTypes: {
      type: 'okapi',
      path: 'material-types',
      records: 'mtypes',
    },
    loanTypes: {
      type: 'okapi',
      path: 'loan-types',
      records: 'loantypes',
    },
  });

  constructor(props) {
    super(props);
    this.state = {
      accordions: {
        itemAccordion: true,
      },
    };

    this.transitionToParams = transitionToParams.bind(this);
    this.removeQueryParam = removeQueryParam.bind(this);
    this.craftLayerUrl = craftLayerUrl.bind(this);
  }

  onClickEditItem = (e) => {
    if (e) e.preventDefault();
    this.transitionToParams({ layer: 'editItem' });
  }

  onClickCloseEditItem = (e) => {
    if (e) e.preventDefault();
    this.removeQueryParam('layer');
  }

  updateItem = (item) => {
    this.props.mutator.items.PUT(item).then(() => {
      this.onClickCloseEditItem();
    });
  }

  handleAccordionToggle = ({ id }) => {
    this.setState((state) => {
      const newState = _.cloneDeep(state);
      newState.accordions[id] = !newState.accordions[id];
      return newState;
    });
  }

  render() {
    const { location, resources: { items, holdingsRecords, instances1, shelfLocations, materialTypes, loanTypes },
      referenceTables,
      okapi } = this.props;

    referenceTables.shelfLocations = (shelfLocations || {}).records || [];
    referenceTables.loanTypes = (loanTypes || {}).records || [];
    referenceTables.materialTypes = (materialTypes || {}).records || [];

    if (!items || !items.hasLoaded || !instances1 || !instances1.hasLoaded || !holdingsRecords || !holdingsRecords.hasLoaded) return <div>Waiting for resources</div>;
    const instance = instances1.records[0];
    const item = items.records[0];
    const holdingsRecord = holdingsRecords.records[0];

    const query = location.search ? queryString.parse(location.search) : {};

    const detailMenu = (
      <PaneMenu>
        <IconButton
          icon="edit"
          id="clickable-edit-item"
          style={{ visibility: !item ? 'hidden' : 'visible' }}
          href={this.craftLayerUrl('editItem')}
          onClick={this.onClickEditItem}
          title="Edit Item"
        />
      </PaneMenu>
    );

    const labelLocation = holdingsRecord.permanentLocationId ? referenceTables.shelfLocations.find(loc => holdingsRecord.permanentLocationId === loc.id).name : '';
    const labelCallNumber = holdingsRecord.callNumber || '';

    return (
      <div>
        <Layer isOpen label="View Item">
          <Pane
            defaultWidth={this.props.paneWidth}
            paneTitle={
              <div style={{ textAlign: 'center' }}>
                {_.get(item, ['barcode'], '')}
                <div>
                  Item . {_.get(item, ['status', 'name'], '')}
                </div>
              </div>
            }
            lastMenu={detailMenu}
            dismissible
            onClose={this.props.onCloseViewItem}
          >
            <Row center="xs">
              <Col sm={6}>
                Instance: {instance.title}
                {(instance.publication && instance.publication.length > 0) &&
                <span><em>, </em><em>{instance.publication[0].publisher}{instance.publication[0].dateOfPublication ? `, ${instance.publication[0].dateOfPublication}` : ''}</em></span>
                }
                <div>
                  {`Holdings: ${labelLocation} > ${labelCallNumber}`}
                </div>
              </Col>
            </Row>
            <Accordion
              open={this.state.accordions.itemAccordion}
              id="itemAccordion"
              onToggle={this.handleAccordionToggle}
              label="Item data"
            >
              <Row>
                <Col sm={12}>
                  Item record {_.get(item, ['materialType', 'name'], '')} {_.get(item, ['status', 'name'], '')}
                </Col>
              </Row>
              <br />
              { (item.barcode) &&
                <Row>
                  <Col sm={12}>
                    <Headline size="medium" margin="medium">
                      {_.get(item, ['barcode'], '')}
                    </Headline>
                  </Col>
                </Row>
              }
              <br /><br />
              { (item.temporaryLocation) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Temporary location" value={_.get(item, ['temporaryLocation', 'name'], '')} />
                  </Col>
                </Row>
              }
              { (item.permanentLoanType) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Permanent loantype" value={_.get(item, ['permanentLoanType', 'name'], '')} />
                  </Col>
                </Row>
              }
              { (item.temporaryLoanType) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Temporary loantype" value={_.get(item, ['temporaryLoanType', 'name'], '')} />
                  </Col>
                </Row>
              }
              { (item.enumeration) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Enumeration" value={_.get(item, ['enumeration'], '')} />
                  </Col>
                </Row>
              }
              { (item.chronology) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Chronology" value={_.get(item, ['chronology'], '')} />
                  </Col>
                </Row>
              }
              { (item.numberOfPieces) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Number of pieces" value={_.get(item, ['numberOfPieces'], '')} />
                  </Col>
                </Row>
              }
              { (item.pieceIdentifiers) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Piece identifiers" value={_.get(item, ['pieceIdentifiers'], []).map((line, i) => <div key={i}>{line}</div>)} />
                  </Col>
                </Row>
              }
              { (item.notes.length > 0) &&
                <Row>
                  <Col smOffset={0} sm={4}>
                    <KeyValue label="Notes" value={_.get(item, ['notes'], []).map((line, i) => <div key={i}>{line}</div>)} />
                  </Col>
                </Row>
              }
            </Accordion>
          </Pane>
        </Layer>
        <Layer isOpen={query.layer ? query.layer === 'editItem' : false} label="Edit Item Dialog">
          <ItemForm
            form={`itemform_${item.id}`}
            onSubmit={(record) => { this.updateItem(record); }}
            initialValues={item}
            onCancel={this.onClickCloseEditItem}
            okapi={okapi}
            instance={instance}
            holdingsRecord={holdingsRecord}
            referenceTables={referenceTables}
          />
        </Layer>
      </div>
    );
  }
}

ViewItem.propTypes = {
  resources: PropTypes.shape({
    instances1: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
    materialTypes: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
    loanTypes: PropTypes.shape({
      records: PropTypes.arrayOf(PropTypes.object),
    }),
  }).isRequired,
  okapi: PropTypes.object,
  location: PropTypes.object,
  paneWidth: PropTypes.string,
  referenceTables: PropTypes.object.isRequired,
  mutator: PropTypes.shape({
    items: PropTypes.shape({
      PUT: PropTypes.func.isRequired,
    }),
  }),
  onCloseViewItem: PropTypes.func.isRequired,
};

export default ViewItem;

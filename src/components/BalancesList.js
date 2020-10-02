import React, { useState } from 'react';
import { PageHeader, Button, Tooltip, List, Row, Col, Grid, Spin } from 'antd';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import {
  refreshWalletPublicKeys,
  useBalanceInfo,
  useWallet,
  useWalletPublicKeys,
} from '../utils/wallet';
import LoadingIndicator from './LoadingIndicator';
import Collapse from '@material-ui/core/Collapse';
import { Typography } from '@material-ui/core';
import TokenInfoDialog from './TokenInfoDialog';
import Link from '@material-ui/core/Link';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';
import { abbreviateAddress } from '../utils/utils';
import SendIcon from '@material-ui/icons/Send';
import ReceiveIcon from '@material-ui/icons/WorkOutline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import AddTokenDialog from './AddTokenDialog';
import SendDialog from './SendDialog';
import DepositDialog from './DepositDialog';
import {
  refreshAccountInfo,
  useSolanaExplorerUrlSuffix,
} from '../utils/connection';
import { showTokenInfoDialog } from '../utils/config';
import {
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  InfoOutlined,
} from '@ant-design/icons';
import { Box, Text } from './layout/StyledComponents';

const { useBreakpoint } = Grid;

const balanceFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
  useGrouping: true,
});

export default function BalancesList() {
  const wallet = useWallet();
  const [publicKeys, loaded] = useWalletPublicKeys();
  const [showAddTokenDialog, setShowAddTokenDialog] = useState(false);

  return (
    <Box style={{ padding: 0, flex: 1 }}>
      <PageHeader
        ghost={false}
        title="Balances"
        extra={[
          <Tooltip title="Add Token">
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => setShowAddTokenDialog(true)}
            />
          </Tooltip>,
          <Tooltip title="Refresh">
            <Button
              shape="circle"
              icon={<ReloadOutlined />}
              onClick={() => {
                refreshWalletPublicKeys(wallet);
                publicKeys.map((publicKey) =>
                  refreshAccountInfo(wallet.connection, publicKey, true),
                );
              }}
            />
          </Tooltip>,
        ]}
      />
      <div style={{ backgroundColor: 'white', padding: '0px 25px' }}>
        <List
          itemLayout="horizontal"
          loading={!loaded}
          dataSource={publicKeys}
          renderItem={(publicKey) => (
            <BalanceListItem key={publicKey.toBase58()} publicKey={publicKey} />
          )}
        />
      </div>
      <AddTokenDialog
        open={showAddTokenDialog}
        onClose={() => setShowAddTokenDialog(false)}
      />
    </Box>
  );
}

const useStyles = makeStyles((theme) => ({
  address: {
    textOverflow: 'ellipsis',
    overflowX: 'hidden',
  },
  itemDetails: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-evenly',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

function BalanceListItem({ publicKey }) {
  const balanceInfo = useBalanceInfo(publicKey);
  const screens = useBreakpoint();

  const [open, setOpen] = useState(false);

  if (!balanceInfo) {
    return <Spin />;
  }

  let { amount, decimals, mint, tokenName, tokenSymbol } = balanceInfo;

  return (
    <List.Item
      actions={[
        <Tooltip title="Info">
          <Button shape="circle" icon={<InfoOutlined />} />
        </Tooltip>,
        <Tooltip title="Send">
          <Button
            type="primary"
            shape="circle"
            style={{ backgroundColor: '#00D2D3', borderWidth: 0 }}
            icon={<SendOutlined rotate={-90} />}
          />
        </Tooltip>,
        <Tooltip title="Receive">
          <Button
            type="primary"
            shape="circle"
            style={{ backgroundColor: '#54A0FF', borderWidth: 0 }}
            icon={<SendOutlined rotate={90} />}
          />
        </Tooltip>,
      ]}
    >
      <Row gutter={[24]} style={{ display: 'flex', flex: 1 }}>
        <Col span={16}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18 }}>
              {tokenName ?? abbreviateAddress(mint)}
              {tokenSymbol ? ` (${tokenSymbol})` : null}
            </span>
            <Text>
              {screens['lg']
                ? publicKey?.toBase58()
                : abbreviateAddress(publicKey)}
            </Text>
          </div>
        </Col>
        <Col span={8}>
          <div
            style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: 18,
            }}
          >
            {balanceFormat.format(amount / Math.pow(10, decimals))}
          </div>
        </Col>
      </Row>
    </List.Item>
  );
}

function BalanceListItem1({ publicKey }) {
  const balanceInfo = useBalanceInfo(publicKey);
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  if (!balanceInfo) {
    return <LoadingIndicator delay={0} />;
  }

  let { amount, decimals, mint, tokenName, tokenSymbol } = balanceInfo;

  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemText
          primary={
            <>
              {balanceFormat.format(amount / Math.pow(10, decimals))}{' '}
              {tokenName ?? abbreviateAddress(mint)}
              {tokenSymbol ? ` (${tokenSymbol})` : null}
            </>
          }
          secondary={publicKey.toBase58()}
          secondaryTypographyProps={{ className: classes.address }}
        />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <BalanceListItemDetails
          publicKey={publicKey}
          balanceInfo={balanceInfo}
        />
      </Collapse>
    </>
  );
}

function BalanceListItemDetails({ publicKey, balanceInfo }) {
  const urlSuffix = useSolanaExplorerUrlSuffix();
  const classes = useStyles();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [tokenInfoDialogOpen, setTokenInfoDialogOpen] = useState(false);

  if (!balanceInfo) {
    return <LoadingIndicator delay={0} />;
  }

  let { mint, tokenName, tokenSymbol, owner } = balanceInfo;

  return (
    <>
      <div className={classes.itemDetails}>
        <div className={classes.buttonContainer}>
          {!publicKey.equals(owner) && showTokenInfoDialog ? (
            <Button
              variant="outlined"
              color="default"
              startIcon={<InfoIcon />}
              onClick={() => setTokenInfoDialogOpen(true)}
            >
              Token Info
            </Button>
          ) : null}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ReceiveIcon />}
            onClick={() => setDepositDialogOpen(true)}
          >
            Receive
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SendIcon />}
            onClick={() => setSendDialogOpen(true)}
          >
            Send
          </Button>
        </div>
        <Typography variant="body2" className={classes.address}>
          Deposit Address: {publicKey.toBase58()}
        </Typography>
        <Typography variant="body2">
          Token Name: {tokenName ?? 'Unknown'}
        </Typography>
        <Typography variant="body2">
          Token Symbol: {tokenSymbol ?? 'Unknown'}
        </Typography>
        {mint ? (
          <Typography variant="body2" className={classes.address}>
            Token Address: {mint.toBase58()}
          </Typography>
        ) : null}
        <Typography variant="body2">
          <Link
            href={
              `https://explorer.solana.com/account/${publicKey.toBase58()}` +
              urlSuffix
            }
            target="_blank"
            rel="noopener"
          >
            View on Solana Explorer
          </Link>
        </Typography>
      </div>
      <SendDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        balanceInfo={balanceInfo}
        publicKey={publicKey}
      />
      <DepositDialog
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        balanceInfo={balanceInfo}
        publicKey={publicKey}
      />
      <TokenInfoDialog
        open={tokenInfoDialogOpen}
        onClose={() => setTokenInfoDialogOpen(false)}
        balanceInfo={balanceInfo}
        publicKey={publicKey}
      />
    </>
  );
}

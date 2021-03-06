// Copyright 2017-2020 @polkadot/app-democracy authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { PropIndex, Proposal } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import React, { useCallback, useMemo, useState } from 'react';
import { Button, Dropdown, Modal, ProposedAction, VoteAccount, VoteActions, VoteToggle, VoteValue } from '@polkadot/react-components';
import { useAccounts, useApi, useToggle } from '@polkadot/react-hooks';
import { isBoolean } from '@polkadot/util';

import { useTranslation } from '../translate';

interface Props {
  proposal?: Proposal;
  referendumId: PropIndex;
}

const CONVICTIONS: [number, number][] = [1, 2, 4, 8, 16, 32].map((lock, index) => [index + 1, lock]);

function Voting ({ proposal, referendumId }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const { hasAccounts } = useAccounts();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [balance, setBalance] = useState<BN | undefined>();
  const [conviction, setConviction] = useState(0);
  const [isVotingOpen, toggleVoting] = useToggle();
  const [aye, setVoteValue] = useState(true);
  const isCurrentVote = useMemo(
    () => !!api.query.democracy.votingOf,
    [api]
  );
  const [enact] = useState(
    (api.consts.democracy.enactmentPeriod.toNumber() * api.consts.timestamp.minimumPeriod.toNumber() / 1000 * 2) / 60 / 60 / 24
  );
  const convictionOpts = useMemo(() => [
    { text: t('0.1x voting balance, no lockup period'), value: 0 },
    ...CONVICTIONS.map(([value, lock]): { text: string; value: number } => ({
      text: t('{{value}}x voting balance, locked for {{lock}}x enactment ({{period}} days)', {
        replace: {
          lock,
          period: (enact * lock).toFixed(2),
          value
        }
      }),
      value
    }))
  ], [t, enact]);

  const _onChangeVote = useCallback(
    (vote?: boolean): void => setVoteValue(isBoolean(vote) ? vote : true),
    []
  );

  if (!hasAccounts) {
    return null;
  }

  return (
    <>
      {isVotingOpen && (
        <Modal
          header={t('Vote on proposal')}
          size='small'
        >
          <Modal.Content>
            <ProposedAction
              idNumber={referendumId}
              proposal={proposal}
            />
            <VoteAccount onChange={setAccountId} />
            {isCurrentVote && (
              <VoteValue
                accountId={accountId}
                autoFocus
                onChange={setBalance}
              />
            )}
            <Dropdown
              help={t('The conviction to use for this vote, with an appropriate lock period.')}
              label={t('conviction')}
              onChange={setConviction}
              options={convictionOpts}
              value={conviction}
            />
            <VoteToggle
              onChange={_onChangeVote}
              value={aye}
            />
          </Modal.Content>
          <VoteActions
            accountId={accountId}
            aye={aye}
            isDisabled={isCurrentVote ? !balance : false}
            onClick={toggleVoting}
            params={
              isCurrentVote
                ? [referendumId, { Standard: { balance, vote: { aye, conviction } } }]
                : [referendumId, { aye, conviction }]}
            tx='democracy.vote'
          />
        </Modal>
      )}
      <Button
        icon='check'
        label={t('Vote')}
        onClick={toggleVoting}
      />
    </>
  );
}

export default React.memo(Voting);

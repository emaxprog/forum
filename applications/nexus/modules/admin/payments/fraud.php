<?php
/**
 * @brief		Anti-Fraud Rules
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Nexus
 * @since		11 Mar 2014
 */

namespace IPS\nexus\modules\admin\payments;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Anti-Fraud Rules
 */
class _fraud extends \IPS\Node\Controller
{
	/**
	 * Node Class
	 */
	protected $nodeClass = 'IPS\nexus\Fraud\Rule';
	
	/**
	 * Description can contain HTML?
	 */
	public $_descriptionHtml = TRUE;
	
	/**
	 * Execute
	 *
	 * @return	void
	 */
	public function execute()
	{
		\IPS\Dispatcher::i()->checkAcpPermission( 'fraud_manage' );
		parent::execute();
	}
	
	/** 
	 * Manage
	 *
	 * @return	void
	 */
	public function manage()
	{
		foreach ( \IPS\nexus\Fraud\Rule::roots() as $rule )
		{
			foreach ( new \IPS\Patterns\ActiveRecordIterator( \IPS\Db::i()->select( '*', 'nexus_fraud_rules', array( 'f_order>?', $rule->order ) ), 'IPS\nexus\Fraud\Rule' ) as $otherRule )
			{
				if ( $rule->isSubsetOf( $otherRule ) )
				{
					\IPS\Output::i()->output = \IPS\Theme::i()->getTemplate( 'global', 'core' )->message( \IPS\Member::loggedIn()->language()->addToStack('fraud_rule_conflict', FALSE, array( 'sprintf' => array( $rule->name, $otherRule->name ) ) ), 'warning', NULL, FALSE );
					break 2;
				}
			}
		}
				
		parent::manage();
	}
}
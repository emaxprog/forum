<?php
/**
 * @brief		Income Report
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Nexus
 * @since		14 Aug 2014
 */

namespace IPS\nexus\modules\admin\reports;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Income Report
 */
class _income extends \IPS\Dispatcher\Controller
{
	/**
	 * Execute
	 *
	 * @return	void
	 */
	public function execute()
	{
		\IPS\Dispatcher::i()->checkAcpPermission( 'income_manage' );
		parent::execute();
	}

	/**
	 * View Report
	 *
	 * @return	void
	 */
	protected function manage()
	{
		$tabs['totals'] = 'nexus_report_income_totals';
		foreach ( \IPS\nexus\Money::currencies() as $currency )
		{
			$tabs[ $currency ] = \IPS\Member::loggedIn()->language()->addToStack( 'nexus_report_income_by_method', NULL, array( 'sprintf' => array( $currency ) ) );
		}
		
		$activeTab = ( isset( \IPS\Request::i()->tab ) and array_key_exists( \IPS\Request::i()->tab, $tabs ) ) ? \IPS\Request::i()->tab : 'totals';
				
		$chart = new \IPS\Helpers\Chart\Database(
			\IPS\Http\Url::internal( 'app=nexus&module=reports&controller=income&tab=' . $activeTab ),
			'nexus_transactions',
			't_date',
			'',
			array(
				'backgroundColor' 	=> '#ffffff',
				'colors'			=> array( '#10967e', '#ea7963', '#de6470', '#6b9dde', '#b09be4', '#eec766', '#9fc973', '#e291bf', '#55c1a6', '#5fb9da' ),
				'hAxis'				=> array( 'gridlines' => array( 'color' => '#f5f5f5' ) ),
				'lineWidth'			=> 1,
				'areaOpacity'		=> 0.4,
			),
			'AreaChart',
			'monthly',
			array( 'start' => 0, 'end' => 0 ),
			array(),
			$activeTab
		);
		$chart->where[] = array( '( t_status=? OR t_status=? )', \IPS\nexus\Transaction::STATUS_PAID, \IPS\nexus\Transaction::STATUS_PART_REFUNDED );
		
		if ( $activeTab === 'totals' )
		{
			$chart->groupBy = 't_currency';
			
			foreach ( \IPS\nexus\Money::currencies() as $currency )
			{
				$chart->addSeries( $currency, 'number', 'SUM(t_amount)-SUM(t_partial_refund)', TRUE, $currency );
			}
		}
		else
		{
			$chart->where[] = array( 't_currency=?', $activeTab );
			$chart->groupBy = 't_method';
			$chart->format = $activeTab;
			
			foreach ( \IPS\nexus\Gateway::roots() as $gateway )
			{
				$chart->addSeries( $gateway->_title, 'number', 'SUM(t_amount)-SUM(t_partial_refund)', TRUE, $gateway->id );
			}
		}
		
		if ( \IPS\Request::i()->isAjax() )
		{
			\IPS\Output::i()->output = (string) $chart;
		}
		else
		{	
			\IPS\Output::i()->title = \IPS\Member::loggedIn()->language()->addToStack('menu__nexus_reports_income');
			\IPS\Output::i()->output = \IPS\Theme::i()->getTemplate( 'global', 'core' )->tabs( $tabs, $activeTab, (string) $chart, \IPS\Http\Url::internal( "app=nexus&module=reports&controller=income" ) );
		}
	}
}
<?php
/**
 * @brief		Downloads Statistics
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Downloads
 * @since		16 Dec 2013
 */

namespace IPS\downloads\modules\admin\stats;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * downloads
 */
class _downloads extends \IPS\Dispatcher\Controller
{
	/**
	 * Execute
	 *
	 * @return	void
	 */
	public function execute()
	{
		\IPS\Dispatcher::i()->checkAcpPermission( 'downloads_manage' );
		parent::execute();
	}

	/**
	 * Downloads Statistics
	 *
	 * @return	void
	 */
	protected function manage()
	{
		$chart = new \IPS\Helpers\Chart\Database( \IPS\Http\Url::internal( "app=downloads&module=stats&controller=downloads" ), 'downloads_downloads', 'dtime', '', array(
			'backgroundColor' 	=> '#ffffff',
			'colors'			=> array( '#10967e', '#ea7963', '#de6470', '#6b9dde', '#b09be4', '#eec766', '#9fc973', '#e291bf', '#55c1a6', '#5fb9da' ),
			'hAxis'				=> array( 'gridlines' => array( 'color' => '#f5f5f5' ) ),
			'lineWidth'			=> 1,
			'areaOpacity'		=> 0.4,
		), 'AreaChart', 'monthly', array( 'start' => 0, 'end' => 0 ), array( 'dmid', 'dfid', 'dtime', 'dsize', 'dua', 'dip' ) );
		
		$chart->addSeries( \IPS\Member::loggedIn()->language()->addToStack('downloads'), 'number', 'COUNT(*)', FALSE );
		$chart->availableTypes = array( 'AreaChart', 'ColumnChart', 'BarChart' );
		
		$chart->tableParsers = array(
			'dmid'	=> function( $val )
			{
				try
				{
					$member = \IPS\Member::load( $val );
					return "<a href='" . \IPS\Http\Url::internal( "app=downloads&module=stats&controller=member&do=downloads&id={$member->member_id}" ) . "'>{$member->name}</a>";
				}
				catch ( \OutOfRangeException $e )
				{
					return \IPS\Member::loggedIn()->language()->addToStack('deleted_member');
				}
			},
			'dfid'	=> function( $val )
			{
				try
				{
					$file = \IPS\downloads\File::load( $val );
					return "<a href='{$file->url()}' target='_blank'>{$file->name}</a>";
				}
				catch ( \OutOfRangeException $e )
				{
					return \IPS\Member::loggedIn()->language()->addToStack('deleted_file');
				}
			},
			'dtime'	=> function( $val )
			{
				return (string) \IPS\DateTime::ts( $val );
			},
			'dsize'	=> function( $val )
			{
				return \IPS\Output\Plugin\Filesize::humanReadableFilesize( $val );
			},
			'dua'	=> function( $val )
			{
				return (string) \IPS\Http\Useragent::parse( $val );
			},
			'dip'	=> function( $val )
			{
				$url = \IPS\Http\Url::internal( "app=core&module=members&controller=ip&ip={$val}&tab=downloads_DownloadLog" );
				return "<a href='{$url}'>{$val}</a>";
			}
		);
		
		\IPS\Output::i()->title = \IPS\Member::loggedIn()->language()->addToStack('downloads_stats');
		\IPS\Output::i()->output = (string) $chart;
	}
	
}
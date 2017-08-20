<?php
/**
 * @brief		ACP Dashboard
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @since		2 July 2013
 */

namespace IPS\core\modules\admin\overview;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * ACP Dashboard
 */
class _dashboard extends \IPS\Dispatcher\Controller
{
	/**
	 * Show the ACP dashboard
	 *
	 * @return	void
	 */
	protected function manage()
	{
		\IPS\Dispatcher::i()->checkAcpPermission( 'view_dashboard' );
		
		\IPS\Output::i()->jsFiles = array_merge( \IPS\Output::i()->jsFiles, \IPS\Output::i()->js('admin_dashboard.js', 'core') );
		\IPS\Output::i()->cssFiles = array_merge( \IPS\Output::i()->cssFiles, \IPS\Theme::i()->css( 'system/dashboard.css', 'core', 'admin' ) );

		/* Figure out which blocks we should show */
		$toShow	= $this->current( TRUE );
		
		/* Now grab dashboard extensions */
		$blocks	= array();
		$info	= array();
		foreach ( \IPS\Application::allExtensions( 'core', 'Dashboard', TRUE, 'core' ) as $key => $extension )
		{
			if ( !method_exists( $extension, 'canView' ) or $extension->canView() )
			{
				$info[ $key ]	= array(
							'name'	=> \IPS\Member::loggedIn()->language()->addToStack('block_' . $key ),
							'key'	=> $key,
							'app'	=> \substr( $key, 0, \strpos( $key, '_' ) )
				);

				if( method_exists( $extension, 'getBlock' ) )
				{
					foreach( $toShow as $row )
					{
						if( in_array( $key, $row ) )
						{
							$blocks[ $key ]	= $extension->getBlock();
							break;
						}
					}
				}
			}
		}
		
		/* ACP Bulletin */
		$bulletin = isset( \IPS\Data\Store::i()->acpBulletin ) ? \IPS\Data\Store::i()->acpBulletin : NULL;
		if ( !$bulletin or $bulletin['time'] < ( time() - 86400 ) )
		{
			try
			{
				$bulletins = \IPS\Http\Url::ips('bulletin')->request()->get()->decodeJson();
				\IPS\Data\Store::i()->acpBulletin = array(
					'time'		=> time(),
					'content'	=> $bulletins ?: array()
				);
			}
			catch( \RuntimeException $e )
			{
				$bulletins = array();
			}
		}
		else
		{
			$bulletins = $bulletin['content'];
		}
		if( !empty( $bulletins ) )
		{
			foreach ( $bulletins as $k => $data )
			{
				if ( count( $data['files'] ) )
				{
					$skip = TRUE;
					foreach ( $data['files'] as $file )
					{
						if ( filemtime( \IPS\ROOT_PATH . '/' . $file ) < $data['timestamp'] )
						{
							$skip = FALSE;
						}
					}
					if ( $skip )
					{
						unset( $bulletins[ $k ] );
					}
				}
			}
		}

		/* Warnings */
		$warnings = array();

		$tasks = \IPS\Db::i()->select( '*', 'core_tasks', 'lock_count >= 3' );

		$keys = array();
		foreach( $tasks as $task )
		{
			$keys[] = $task['key'];
		}

		if ( !empty( $keys ) )
		{
			$warnings[] = array(
				'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_broken' ),
				'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_broken_desc', TRUE, array( 'sprintf' => array( \IPS\Member::loggedIn()->language()->formatList( $keys ) ) ) )
			);
		}

		if( isset( \IPS\Data\Store::i()->failedMailCount ) AND \IPS\Data\Store::i()->failedMailCount >= 3 )
		{
			$warnings[] = array(
				'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_email_broken' ),
				'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_email_broken_desc', TRUE )
			);
		}
		
		$supportAccount = \IPS\Member::load( 'nobody@invisionpower.com', 'email' );
		if ( $supportAccount->member_id )
		{
			$warnings[] = array(
				'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_support_account' ),
				'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_support_account_desc', TRUE, array( 'sprintf' => array( $supportAccount->acpUrl() ) ) )
			);
		}

		/* Check Tasks */
		try
		{
			$task = \IPS\DateTime::ts( \IPS\Db::i()->select( 'next_run', 'core_tasks', array( 'enabled=?', TRUE ), 'next_run ASC' )->first() );
			$today = new \IPS\DateTime;
			$difference = $today->diff( $task )->h + ( $today->diff( $task )->days * 24 );

			if ( $difference >= 36 )
			{
				if( \IPS\Settings::i()->task_use_cron == 'cron' )
				{
					$warnings[] = array(
						'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_broken' ),
						'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_cron_broken_desc' )
					);
				}
				elseif( \IPS\Settings::i()->task_use_cron == 'web' )
				{
					$warnings[] = array(
						'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_broken' ),
						'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_web_broken_desc' )
					);
				}
				else
				{
					$warnings[] = array(
						'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_broken' ),
						'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_tasks_not_enough_desc' )
					);
				}
			}
		}
		catch ( \UnderflowException $e ) { }

		if ( !\IPS\Settings::i()->site_online AND \IPS\Settings::i()->task_use_cron == 'normal' AND !\IPS\CIC )
		{
			$warnings[] = array(
				'title' => \IPS\Member::loggedIn()->language()->addToStack('dasbhoard_tasks_site_offline'),
				'description' => \IPS\Member::loggedIn()->language()->addToStack('dasbhoard_tasks_site_offline_desc')
			);
		}

		/* If there have been more than 10 datastore failurs in the last hour, or if an instant test fails, show a message */
		if( !\IPS\Data\Store::i()->test() OR \IPS\Db::i()->select( 'COUNT(*)', 'core_log', array( '`category`=? AND `time`>?', 'datastore', \IPS\DateTime::create()->sub( new \DateInterval( 'PT1H' ) )->getTimestamp() ) )->first() >= 10 )
		{
			/* Have we just recently updated the configuration? If so, ignore this warning for 24 hours */
			if( \IPS\Settings::i()->last_data_store_update < \IPS\DateTime::create()->sub( new \DateInterval( 'PT24H' ) )->getTimestamp() )
			{
				$warnings[] = array(
					'title' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_datastore_broken' ),
					'description' => \IPS\Member::loggedIn()->language()->addToStack( 'dashboard_datastore_broken_desc' )
				);
			}
		}

		/* Get new core update available data */
		$update	= \IPS\Application::load( 'core' )->availableUpgrade( TRUE );

		\IPS\Output::i()->title		= \IPS\Member::loggedIn()->language()->addToStack('dashboard');
		\IPS\Output::i()->customHeader = \IPS\Theme::i()->getTemplate( 'dashboard' )->dashboardHeader( $info, $blocks );
		\IPS\Output::i()->output	= \IPS\Theme::i()->getTemplate( 'dashboard' )->dashboard( $update, $toShow, $blocks, $info, $bulletins, $warnings );
	}

	/**
	 * Return a json-encoded array of the current blocks to show
	 *
	 * @param	bool	$return	Flag to indicate if the array should be returned instead of output
	 * @return	void
	 */
	public function current( $return=FALSE )
	{
		if( \IPS\Settings::i()->acp_dashboard_blocks )
		{
			$blocks = json_decode( \IPS\Settings::i()->acp_dashboard_blocks, TRUE );
		}
		else
		{
			$blocks = array();
		}

		$toShow	= isset( $blocks[ \IPS\Member::loggedIn()->member_id ] ) ? $blocks[ \IPS\Member::loggedIn()->member_id ] : array();

		if( !$toShow OR !isset( $toShow['main'] ) OR !isset( $toShow['side'] ) )
		{
			$toShow	= array(
				'main' => array( 'core_AdminNotes', 'core_Registrations', 'core_AwaitingValidation', 'core_BackgroundQueue' ),
				'side' => array( 'core_OnlineAdmins', 'core_FailedLogins', 'core_OnlineUsers' ),
			);

			$blocks[ \IPS\Member::loggedIn()->member_id ]	= $toShow;

			\IPS\Settings::i()->acp_dashboard_blocks = json_encode( $blocks );
			\IPS\Db::i()->update( 'core_sys_conf_settings', array( 'conf_value' => \IPS\Settings::i()->acp_dashboard_blocks ), array( 'conf_key=?', 'acp_dashboard_blocks' ) );
			unset( \IPS\Data\Store::i()->settings );
		}

		if( $return === TRUE )
		{
			return $toShow;
		}

		\IPS\Output::i()->output		= json_encode( $toShow );
	}

	/**
	 * Return an individual block's HTML
	 *
	 * @return	void
	 */
	public function getBlock()
	{
		$output		= '';

		/* Loop through the dashboard extensions in the specified application */
		foreach( \IPS\Application::load( \IPS\Request::i()->appKey )->extensions( 'core', 'Dashboard', 'core' ) as $key => $_extension )
		{
			if( \IPS\Request::i()->appKey . '_' . $key == \IPS\Request::i()->blockKey )
			{
				if( method_exists( $_extension, 'getBlock' ) )
				{
					$output	= $_extension->getBlock();
				}

				break;
			}
		}

		\IPS\Output::i()->output	= $output;
	}

	/**
	 * Update our current block configuration/order
	 *
	 * @return	void
	 * @note	When submitted via AJAX, the array should be json-encoded
	 */
	public function update()
	{
		if( \IPS\Settings::i()->acp_dashboard_blocks )
		{
			$blocks = json_decode( \IPS\Settings::i()->acp_dashboard_blocks, TRUE );
		}
		else
		{
			$blocks = array();
		}

		$saveBlocks = \IPS\Request::i()->blocks;
		
		if( !isset( $saveBlocks['main'] ) )
		{
			$saveBlocks['main'] = array();
		}
		if( !isset( $saveBlocks['side'] ) )
		{
			$saveBlocks['side'] = array();
		}
		
		$blocks[ \IPS\Member::loggedIn()->member_id ] = $saveBlocks;

		\IPS\Settings::i()->acp_dashboard_blocks = json_encode( $blocks );
		\IPS\Db::i()->update( 'core_sys_conf_settings', array( 'conf_value' => \IPS\Settings::i()->acp_dashboard_blocks ), array( 'conf_key=?', 'acp_dashboard_blocks' ) );
		unset( \IPS\Data\Store::i()->settings );

		if( \IPS\Request::i()->isAjax() )
		{
			\IPS\Output::i()->output = 1;
			return;
		}

		\IPS\Output::i()->redirect( \IPS\Http\Url::internal( "app=core&module=overview&controller=dashboard" ), 'saved' );
	}	
}
<?php
/**
 * @brief		Settings
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Downloads
 * @since		09 Oct 2013
 */

namespace IPS\downloads\modules\admin\downloads;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Settings
 */
class _settings extends \IPS\Dispatcher\Controller
{
	/**
	 * Manage Settings
	 *
	 * @return	void
	 */
	protected function manage()
	{
		\IPS\Dispatcher::i()->checkAcpPermission( 'settings_manage' );

		$form = $this->getForm();

		if ( $values = $form->values( TRUE ) )
		{
			$this->saveSettingsForm( $form, $values );

			/* Clear guest page caches */
			\IPS\Data\Cache::i()->clearAll();

			\IPS\Session::i()->log( 'acplogs__downloads_settings' );
		}

		\IPS\Output::i()->title = \IPS\Member::loggedIn()->language()->addToStack('settings');
		\IPS\Output::i()->output = $form;
	}

	/**
	 * Build and return the settings form
	 *
	 * @note	Abstracted to allow third party devs to extend easier
	 * @return	\IPS\Helpers\Form
	 */
	protected function getForm()
	{
		$form = new \IPS\Helpers\Form;

		$form->addTab( 'idm_landing_page' );
		$form->addHeader( 'featured_downloads' );
        $form->add( new \IPS\Helpers\Form\YesNo( 'idm_show_featured', \IPS\Settings::i()->idm_show_featured, FALSE, array( 'togglesOn' => array( 'idm_featured_count' ) ) ) );
        $form->add( new \IPS\Helpers\Form\Number( 'idm_featured_count', \IPS\Settings::i()->idm_featured_count, FALSE, array(), NULL, NULL, NULL, 'idm_featured_count' ) );

		$form->addHeader('browse_whats_new');
        $form->add( new \IPS\Helpers\Form\YesNo( 'idm_show_newest', \IPS\Settings::i()->idm_show_newest, FALSE, array('togglesOn' => array( 'idm_newest_categories') ) ) );
        $form->add( new \IPS\Helpers\Form\Node( 'idm_newest_categories', ( \IPS\Settings::i()->idm_newest_categories AND \IPS\Settings::i()->idm_newest_categories != 0 ) ? explode( ',', \IPS\Settings::i()->idm_newest_categories ) : 0, FALSE, array(
            'class' => 'IPS\downloads\Category',
            'zeroVal' => 'any',
            'multiple' => TRUE ), NULL, NULL, NULL, 'idm_newest_categories') );

		$form->addHeader('browse_highest_rated');
        $form->add( new \IPS\Helpers\Form\YesNo( 'idm_show_highest_rated', \IPS\Settings::i()->idm_show_highest_rated, FALSE, array( 'togglesOn' => array( 'idm_highest_rated_categories' ) ) ) );
		$form->add( new \IPS\Helpers\Form\Node( 'idm_highest_rated_categories', ( \IPS\Settings::i()->idm_highest_rated_categories AND \IPS\Settings::i()->idm_highest_rated_categories != 0 ) ? explode( ',', \IPS\Settings::i()->idm_highest_rated_categories ) : 0, FALSE, array(
			'class' => 'IPS\downloads\Category',
			'zeroVal' => 'any',
			'multiple' => TRUE ), NULL, NULL, NULL, 'idm_highest_rated_categories') );

		$form->addHeader('browse_most_downloaded');
        $form->add( new \IPS\Helpers\Form\YesNo( 'idm_show_most_downloaded', \IPS\Settings::i()->idm_show_most_downloaded, FALSE, array( 'togglesOn' => array( 'idm_show_most_downloaded_categories' ) ) ) );
		$form->add( new \IPS\Helpers\Form\Node( 'idm_show_most_downloaded_categories', ( \IPS\Settings::i()->idm_show_most_downloaded_categories AND \IPS\Settings::i()->idm_show_most_downloaded_categories != 0 ) ? explode( ',', \IPS\Settings::i()->idm_show_most_downloaded_categories ) : 0, FALSE, array(
			'class' => 'IPS\downloads\Category',
			'zeroVal' => 'any',
			'multiple' => TRUE ), NULL, NULL, NULL, 'idm_show_most_downloaded_categories') );


        $form->addTab( 'basic_settings' );
		$form->add( new \IPS\Helpers\Form\Upload( 'idm_watermarkpath', \IPS\Settings::i()->idm_watermarkpath ? \IPS\File::get( 'core_Theme', \IPS\Settings::i()->idm_watermarkpath ) : NULL, FALSE, array( 'image' => TRUE, 'storageExtension' => 'core_Theme' ) ) );
		$form->add( new \IPS\Helpers\Form\Stack( 'idm_link_blacklist', explode( ',', \IPS\Settings::i()->idm_link_blacklist ), FALSE, array( 'placeholder' => 'example.com' ) ) );
		$form->add( new \IPS\Helpers\Form\YesNo( 'idm_antileech', \IPS\Settings::i()->idm_antileech ) );
		$form->add( new \IPS\Helpers\Form\YesNo( 'idm_rss', \IPS\Settings::i()->idm_rss ) );

		if ( \IPS\Application::appIsEnabled( 'nexus' ) )
		{
			$form->addTab( 'paid_file_settings' );
			$form->add( new \IPS\Helpers\Form\YesNo( 'idm_nexus_on', \IPS\Settings::i()->idm_nexus_on, FALSE, array( 'togglesOn' => array( 'idm_nexus_tax', 'idm_nexus_percent', 'idm_nexus_transfee' ) ) ) );
			$form->add( new \IPS\Helpers\Form\Node( 'idm_nexus_tax', \IPS\Settings::i()->idm_nexus_tax ?:0, FALSE, array( 'class' => '\IPS\nexus\Tax', 'zeroVal' => 'do_not_tax' ), NULL, NULL, NULL, 'idm_nexus_tax' ) );
			$form->add( new \IPS\Helpers\Form\Number( 'idm_nexus_percent', \IPS\Settings::i()->idm_nexus_percent, FALSE, array( 'min' => 0, 'max' => 100 ), NULL, NULL, '%', 'idm_nexus_percent' ) );
			$form->add( new \IPS\nexus\Form\Money( 'idm_nexus_transfee', json_decode( \IPS\Settings::i()->idm_nexus_transfee, TRUE ), FALSE, array(), NULL, NULL, NULL, 'idm_nexus_transfee' ) );
			$form->add( new \IPS\Helpers\Form\Node( 'idm_nexus_gateways', ( \IPS\Settings::i()->idm_nexus_gateways ) ? explode( ',', \IPS\Settings::i()->idm_nexus_gateways ) : 0, FALSE, array( 'class' => '\IPS\nexus\Gateway', 'zeroVal' => 'no_restriction', 'multiple' => TRUE ), NULL, NULL, NULL, 'idm_nexus_gateways' ) );
			$form->add( new \IPS\Helpers\Form\CheckboxSet( 'idm_nexus_display', explode( ',', \IPS\Settings::i()->idm_nexus_display ), FALSE, array( 'options' => array( 'purchases' => 'idm_purchases', 'downloads' => 'downloads' ) ) ) );
		}

		return $form;
	}

	/**
	 * Save the settings form
	 *
	 * @param \IPS\Helpers\Form 	$form		The Form Object
	 * @param array 				$values		Values
	 */
	protected function saveSettingsForm( \IPS\Helpers\Form $form, array $values )
	{
		/* We can't store '' for idm_nexus_display as it will fall back to the default */
		if ( ! $values['idm_nexus_display'] )
		{
			$values['idm_nexus_display'] = 'none';
		}

		$form->saveAsSettings( $values );
	}

	/**
	 * Rebuild Watermarks
	 *
	 * @return	void
	 */
	protected function rebuildWatermarks()
	{
		$perGo = 1;
		$watermark = \IPS\Settings::i()->idm_watermarkpath ? \IPS\Image::create( \IPS\File::get( 'core_Theme', \IPS\Settings::i()->idm_watermarkpath )->contents() ) : NULL;

		\IPS\Output::i()->output = new \IPS\Helpers\MultipleRedirect( \IPS\Http\Url::internal( 'app=downloads&module=downloads&controller=settings&do=rebuildWatermarks' ), function( $doneSoFar ) use( $watermark, $perGo )
		{
			$doneSoFar = intval( $doneSoFar );

			$where = array( array( 'record_type=?', 'ssupload' ) );
			if ( !$watermark )
			{
				$where[] = array( 'record_no_watermark<>?', '' );
			}

			$select = \IPS\Db::i()->select( '*', 'downloads_files_records', $where, 'record_id', array( $doneSoFar, $perGo ), NULL, NULL, \IPS\Db::SELECT_SQL_CALC_FOUND_ROWS );
			if ( !$select->count() )
			{
				return NULL;
			}

			foreach ( $select as $row )
			{
				try
				{
					if ( $row['record_no_watermark'] )
					{
						$original = \IPS\File::get( 'downloads_Screenshots', $row['record_no_watermark'] );

						try
						{
							\IPS\File::get( 'downloads_Screenshots', $row['record_location'] )->delete();
						}
						catch ( \Exception $e ) { }

						if ( !$watermark )
						{
							\IPS\Db::i()->update( 'downloads_files_records', array(
								'record_location'		=> (string) $original,
								'record_thumb'			=> (string) $original->thumbnail( 'downloads_Screenshots' ),
								'record_no_watermark'	=> NULL
							), array( 'record_id=?', $row['record_id'] ) );

							continue;
						}
					}
					else
					{
						$original = \IPS\File::get( 'downloads_Screenshots', $row['record_location'] );
					}

					$image = \IPS\Image::create( $original->contents() );
					$image->watermark( $watermark );

					$newFile = \IPS\File::create( 'downloads_Screenshots', $original->originalFilename, $image );

					\IPS\Db::i()->update( 'downloads_files_records', array(
						'record_location'		=> (string) $newFile,
						'record_thumb'			=> (string) $newFile->thumbnail( 'downloads_Screenshots' ),
						'record_no_watermark'	=> (string) $original
					), array( 'record_id=?', $row['record_id'] ) );
				}
				catch ( \Exception $e ) {}
			}

			$doneSoFar += $perGo;
			return array( $doneSoFar, \IPS\Member::loggedIn()->language()->addToStack('rebuilding'), 100 / $select->count( TRUE ) * $doneSoFar );

		}, function()
		{
			\IPS\Output::i()->redirect( \IPS\Http\Url::internal( 'app=downloads&module=downloads&controller=settings' ), 'completed' );
		} );
	}
}
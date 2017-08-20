<?php
/**
 * @brief		Create Menu Extension : Records
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Content
 * @since		18 Dec 2014
 */

namespace IPS\cms\extensions\core\CreateMenu;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Create Menu Extension: Records
 */
class _Records
{
	/**
	 * Get Items
	 *
	 * @return	array
	 */
	public function getItems()
	{
		$items = array();
		
		foreach( \IPS\cms\Databases::databases() as $database )
		{
			if ( $database->page_id > 0 and $database->can('view') )
			{
				$catClass = '\IPS\cms\Categories' . $database->id;
				if ( $database->can('add') )
				{
					try
					{
						$page = \IPS\cms\Pages\Page::load( $database->page_id );
						
						$items[ 'cms_create_menu_records_' . $database->id ] = array(
							'link' 			=> $page->url()->setQueryString('do', 'form'),
							'extraData'		=> ( $database->use_categories ) ? array( 'data-ipsDialog' => true, 'data-ipsDialog-size' => "narrow" ) : array(),
							'title' 		=> 'cms_select_category'
						);
						
					}
					catch( \OutOfRangeException $ex ) { }
				}
			}
		}
		
		ksort( $items );
		
		return $items;
	}
}
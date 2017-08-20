<?php
/**
 * @brief		Custom table helper for gallery images to override move menu
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Gallery
 * @since		04 Apr 2014
 */

namespace IPS\gallery\Image;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Custom table helper for gallery images to override move menu
 */
class _Table extends \IPS\Helpers\Table\Content
{
	/**
	 * Constructor
	 *
	 * @param	array					$class				Database table
	 * @param	\IPS\Http\Url			$baseUrl			Base URL
	 * @param	array|null				$where				WHERE clause (To restrict to a node, use $container instead)
	 * @param	\IPS\Node\Model|NULL	$container			The container
	 * @param	bool|null				$includeHidden		Flag to pass to getItemsWithPermission() method for $includeHiddenContent, defaults to NULL
	 * @param	string|NULL				$permCheck			Permission key to check
	 * @return	void
	 */
	public function __construct( $class, \IPS\Http\Url $baseUrl, $where=NULL, \IPS\Node\Model $container=NULL, $includeHidden=\IPS\Content\Hideable::FILTER_AUTOMATIC, $permCheck='view', $honorPinned=TRUE )
	{
		/* Are we changing the thumbnail viewing size? */
		if( isset( \IPS\Request::i()->thumbnailSize ) )
		{
			\IPS\Session::i()->csrfCheck();

			\IPS\Request::i()->setCookie( 'thumbnailSize', \IPS\Request::i()->thumbnailSize, \IPS\DateTime::ts( time() )->add( new \DateInterval( 'P1Y' ) ) );

			/* Do a 303 redirect to prevent indexing of the CSRF link */
			\IPS\Output::i()->redirect( \IPS\Request::i()->url(), '', 303 );
		}

		return parent::__construct( $class, $baseUrl, $where, $container, $includeHidden, $permCheck, $honorPinned );
	}

	/**
	 * Multimod
	 *
	 * @return	void
	 */
	protected function multimod()
	{
		\IPS\Session::i()->csrfCheck();

		/* Basic check that we selected something */
		if( !isset( \IPS\Request::i()->moderate ) OR empty( \IPS\Request::i()->moderate ) )
		{
			\IPS\Output::i()->error( 'nothing_mm_selected', '1G329/1', 403, '' );
		}
		
		$class = $this->class;
		$params = array();
		
		if ( \IPS\Request::i()->modaction == 'move' )
		{
			$form = new \IPS\Helpers\Form( 'form', 'move' );
			$form->add( new \IPS\Helpers\Form\Node( 'move_to_category', NULL, FALSE, array( 'clubs' => true, 'class' => 'IPS\\gallery\\Category', 'url' => \IPS\Request::i()->url()->setQueryString( 'modaction', 'move' ) ) ) );
			$form->add( new \IPS\Helpers\Form\Node( 'move_to_album', NULL, FALSE, array( 
				'class' 				=> 'IPS\\gallery\\Album',
				'forceOwner'			=> FALSE,
				'url'					=> \IPS\Request::i()->url()->setQueryString( 'modaction', 'move' ),
				'permissionCheck' 		=> function( $node )
				{
					/* Have we hit an images per album limit? */
					if( $node->owner()->group['g_img_album_limit'] AND ( $node->count_imgs + $node->count_imgs_hidden ) >= $node->owner()->group['g_img_album_limit'] )
					{
						return false;
					}
					
					return true;
				}
			) ) );

			if ( $values = $form->values() )
			{
				if( ( !isset( $values['move_to_category'] ) OR !( $values['move_to_category'] instanceof \IPS\Node\Model ) ) AND
					( !isset( $values['move_to_album'] ) OR !( $values['move_to_album'] instanceof \IPS\Node\Model ) ) )
				{
					$form->error	= \IPS\Member::loggedIn()->language()->addToStack('gallery_cat_or_album');

					\IPS\Output::i()->output = $form->customTemplate( array( call_user_func_array( array( \IPS\Theme::i(), 'getTemplate' ), array( 'forms', 'core' ) ), 'popupTemplate' ) );
					return;
				}

				$params[] = ( isset( $values['move_to_category'] ) AND $values['move_to_category'] ) ? $values['move_to_category'] : $values['move_to_album'];
				$params[] = FALSE;
			}
			else
			{
				\IPS\Output::i()->output = $form->customTemplate( array( call_user_func_array( array( \IPS\Theme::i(), 'getTemplate' ), array( 'forms', 'core' ) ), 'popupTemplate' ) );
				
				if ( \IPS\Request::i()->isAjax() )
				{
					\IPS\Output::i()->sendOutput( \IPS\Output::i()->output  );
				}
				else
				{
					\IPS\Output::i()->sendOutput( \IPS\Theme::i()->getTemplate( 'global', 'core' )->globalTemplate( \IPS\Output::i()->title, \IPS\Output::i()->output, array( 'app' => \IPS\Dispatcher::i()->application->directory, 'module' => \IPS\Dispatcher::i()->module->key, 'controller' => \IPS\Dispatcher::i()->controller ) ), 200, 'text/html', \IPS\Output::i()->httpHeaders );
				}
				return;
			}
		}
		
		foreach ( array_keys( \IPS\Request::i()->moderate ) as $id )
		{
			try
			{
				$object = $class::loadAndCheckPerms( $id );
				$object->modAction( \IPS\Request::i()->modaction, \IPS\Member::loggedIn(), $params );
			}
			catch ( \Exception $e ) {}
		}
		
		\IPS\Output::i()->redirect( $this->baseUrl );
	}
}
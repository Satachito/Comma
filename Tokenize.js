export const
OperatorC	= '+-*/%=<>!~&|^?:.'

export const
OpenParen	= '[({'

export const
CloseParen	= '])}'

export const
OpenString	= '`"\''

export const
Tokenize	= S => {	//	Source

	const	$	= []
	let		_	= 0

	const
	ReadRemain	= ( closer, extra ) => {
		let $ = ''
		while( _ < S.length ) {
			const
			C = S[ _++ ]
			$ += C
			if ( closer( C ) ) break
			C === '\\'
			?	_ < S.length && ( $ += S[ _++ ] )
			:	extra && ( $ += extra( C ) )
		}
		return $
	}

	const
	ReadOperatorRemain = () => {
		let
		$ = ''
		while ( _ < S.length && OperatorC.includes( S[ _ ] ) ) $ += S[ _++ ]
		return $
	}

	let
	word = ''
	while( _ < S.length ) {

		const
		C = S[ _++ ]

		const
		ReadC = () => {
			if( S[ _ ] === '*' ) {
				_ += 2
				while( _ < S.length - 1 ) if( S[ _++ ] === '*' && S[ _++ ] === '/' ) break
			} else if( S[ _ ] === '/' ) {
				_ += 2
				while( _ < S.length ) if( S[ _++ ] === '\n' ) break
				$.push( '\n' )
			} else {
				const _Saved = _
				const RE = ReadRemain(
					_ => '/\n'.includes( _ )
				,	_ => _ === '['
					?	ReadRemain( _ => _ === ']' )
					:	''
				)
				if( RE.at( -1 ) === '/' ) $.push( C + RE )
				else {
					_ = _Saved
					$.push( C + ReadOperatorRemain() )
				}
			}
		}

		C.match( /\s/ )
		?	(	word && ( $.push( word ), word = '' )
			,	C === '\n' && !( $.at( -1 ) === C ) && $.push( C )
			)
		:	OperatorC.includes( C )
			?	(	word && ( $.push( word ), word = '' )
				,	C === '/' ?	ReadC() : $.push( C + ReadOperatorRemain() )
				)
			:	OpenString.includes( C )
				?	(	word && ( $.push( word ), word = '' ), $.push( C + ReadRemain( _ => _ === C ) ) )
				:	C === ',' || C === ';' || OpenParen.includes( C ) || CloseParen.includes( C )
					?	(	word && ( $.push( word ), word = '' ), $.push( C ) )
					:	(	word += C
						,	console.assert( C !== '@', "Inhibited char: @" )
						,	console.assert( C !== '#', "Inhibited char: #" )
						)
	}
	word && $.push( word )

	return $
}

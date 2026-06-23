UPDATE app_state
SET state = replace(
    replace(
        replace(
            replace(
                replace(
                    state,
                    'c' || char(65533) || char(65533) || char(65533) || char(65533) || 'rebro',
                    'c' || char(233) || 'rebro'
                ),
                'R' || char(65533) || char(65533) || 'quiem',
                'R' || char(233) || 'quiem'
            ),
            char(65533) || char(65533) || char(180) || 'A origem' || char(180) || char(180),
            char(8220) || 'A Origem' || char(8221)
        ),
        char(65533) || char(65533) || 'timo',
        char(243) || 'timo'
    ),
    'sensa' || char(231) || char(65533) || char(65533) || 'o',
    'sensa' || char(231) || char(227) || 'o'
)
WHERE id = 'main';

import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/sqlite";
import { Id, IdType } from "../types";

@Entity()
export class ParentEntity {
    @PrimaryKey({ type: IdType, autoincrement: false })
    id!: Id;
    
    @OneToMany({
        entity: () => ChildEntity,
        mappedBy: 'parent',
        orphanRemoval: true,
      })
    children = new Collection<ChildEntity>(this);
}

@Entity()
export class ChildEntity {
    @PrimaryKey({ type: IdType, autoincrement: false })
    id!: Id;

    @ManyToOne(() => ParentEntity)
    parent!: ParentEntity;
}

describe('Bug', () => {
    let orm: MikroORM;
    let parent: ParentEntity;

    beforeEach(async () => {
        orm = await MikroORM.init({
            entities: [ParentEntity, ChildEntity],
            dbName: ':memory:',
            debug: true,
        });

        await orm.schema.refreshDatabase();
    });

    beforeEach(async () => {
        const parentEntityRepository = orm.em.fork().getRepository(ParentEntity);

        // Create parent
        parent = new ParentEntity();
        parent.id = new Id('1');

        // Create child
        const child = new ChildEntity();
        child.id = new Id('123');

        // Add child to parent
        parent.children.add(child)

        parentEntityRepository.persistAndFlush(parent);
    });

    afterAll(async () => {
        await orm.close();
    });

    it('should remove child entities', async () => {
        const parentRepository = orm.em.fork().getRepository(ParentEntity);

        // Load parent entity 
        const parent = await parentRepository.createQueryBuilder('p').leftJoinAndSelect('p.children', 'c').where({id: 1}).getSingleResult();

        if(!parent) {
            throw new Error('Some entity not found');
        }

        // Remove all children
        parent.children.removeAll();

        // BUG
        // I expect that child entities will be deleted since orphanRemoval is set to true
        // But change set persister will run the following query: "delete from `child_entity` where `id` in ('[object Object]')"
        // So it won't delete anything
        await parentRepository.flush();

        // Load all records from database
        const records = await orm.em.getConnection().getKnex().select('*').from('child_entity');

        // Here it will fail
        // Make sure there are no records
        expect(records).toEqual([]);
    })
});
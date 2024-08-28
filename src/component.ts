import { CompoundTag, ListTag, StringTag, Tag } from "@serenityjs/nbt";
import { Entity, EntityComponent, Player } from "@serenityjs/world";

class EntitySlapperComponent extends EntityComponent {
  public static readonly identifier = "serenity:slapper";

  /**
   * The command that the entity will run at the player.
  */
  public commands: Array<string> = [ "give @s diamond" ];

  /**
   * Create a new instance of the EntitySlapperComponent
   * @param entity 
   */
  public constructor(entity: Entity) {
    super(entity, EntitySlapperComponent.identifier);
  }

  public onInteract(player: Player): void {
    // Execute the commands at the player.
    for (const command of this.commands)
      player.executeCommand(command);
  }

  public getEntity(): Entity {
    return this.entity;
  }

  public getNametag(): string {
    return this.entity.getNametag();
  }

  public static serialize(nbt: CompoundTag, component: EntitySlapperComponent): void {
    nbt.createListTag(
      "commands",
      Tag.String,
      component.commands.map(command => new StringTag("", command))
    );
  }

  public static deserialize(nbt: CompoundTag, entity: Entity): EntitySlapperComponent {
    const component = new EntitySlapperComponent(entity);

    for (const command of nbt.getTag<ListTag<StringTag>>("commands")?.value ?? [])
      component.commands.push(command.value);

    return component;
  }
}

// Bind the component to the registry
// This will allow the component to be saved and loaded from the world
EntitySlapperComponent.bind();

export { EntitySlapperComponent };